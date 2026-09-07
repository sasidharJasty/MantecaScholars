import json
import os
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import (
    AdminAssignment, ChatMessage, ChatRoom, DirectMessage, Event,
    Program, Roster, User, WebsiteContent,
)


TABLES = ('profiles', 'user_roles', 'programs', 'rosters', 'events',
          'admin_assignments', 'chat_rooms', 'chat_messages',
          'direct_messages', 'website_content')


def load_env():
    values = {}
    env_path = Path(__file__).resolve().parents[4] / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    values.update({key: value for key, value in os.environ.items() if key in {
        'VITE_SUPABASE_URL', 'VITE_SUPABASE_SERVICE_ROLE_KEY'
    }})
    return values


def fetch_table(url, key, table):
    result = subprocess.run([
        'curl', '--fail', '--silent', '--show-error', '--max-time', '60',
        f'{url}/rest/v1/{table}?select=*',
        '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}',
    ], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


class Command(BaseCommand):
    help = 'Import Supabase data into the Django database without modifying Supabase.'

    def add_arguments(self, parser):
        parser.add_argument('--replace', action='store_true', help='Clear Django application data before importing.')

    def handle(self, *args, **options):
        config = load_env()
        url = config.get('VITE_SUPABASE_URL')
        key = config.get('VITE_SUPABASE_SERVICE_ROLE_KEY')
        if not url or not key:
            raise CommandError('VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are required.')

        existing = sum(model.objects.count() for model in (User, Program, Roster, Event, ChatRoom, ChatMessage, DirectMessage, WebsiteContent))
        if existing and not options['replace']:
            raise CommandError('Django already contains application data. Re-run with --replace only after verifying the backup.')

        self.stdout.write('Exporting Supabase tables (read-only)…')
        data = {table: fetch_table(url.rstrip('/'), key, table) for table in TABLES}
        self.stdout.write(', '.join(f'{table}={len(rows)}' for table, rows in data.items()))

        with transaction.atomic():
            if options['replace']:
                DirectMessage.objects.all().delete(); ChatMessage.objects.all().delete(); ChatRoom.objects.all().delete()
                Event.objects.all().delete(); Roster.objects.all().delete(); AdminAssignment.objects.all().delete()
                WebsiteContent.objects.all().delete(); Program.objects.all().delete(); User.objects.all().delete()

            user_map = {}
            role_map = {}
            for row in data['user_roles']:
                role_map[row.get('user_id')] = row.get('role') or 'student'
            for row in data['profiles']:
                email = (row.get('email') or '').strip().lower()
                if not email:
                    continue
                user, _ = User.objects.update_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'first_name': row.get('first_name') or '',
                        'last_name': row.get('last_name') or '',
                        'full_name': f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
                        'role': row.get('role') or role_map.get(row.get('id')) or 'student',
                        'member_id': row.get('member_id'),
                        'account_status': row.get('account_status') or 'approved',
                        'onboarding_completed': bool(row.get('has_seen_onboarding') or row.get('onboarding_completed')),
                    },
                )
                user.set_unusable_password()
                user.save(update_fields=['password'])
                user_map[row.get('id')] = user

            program_map = {}
            for row in data['programs']:
                program, _ = Program.objects.update_or_create(
                    name=row.get('name') or f"Imported program {row.get('id')}",
                    defaults={
                        'website': row.get('website') or '',
                        'description': row.get('description') or '',
                        'info_content': row.get('info_content') or '',
                    },
                )
                program_map[row.get('id')] = program

            for row in data['rosters']:
                user, program = user_map.get(row.get('user_id')), program_map.get(row.get('program_id'))
                if user and program:
                    Roster.objects.update_or_create(user=user, program=program, defaults={'is_team_leader': bool(row.get('is_team_leader')), 'is_muted': bool(row.get('is_muted'))})

            for row in data['events']:
                program = program_map.get(row.get('program_id'))
                if program and row.get('event_date'):
                    Event.objects.create(program=program, title=row.get('title') or 'Imported event', description=row.get('description') or '', event_date=row['event_date'], location=row.get('location') or '', created_by=user_map.get(row.get('created_by')))

            for row in data['admin_assignments']:
                admin, program = user_map.get(row.get('admin_id')), program_map.get(row.get('program_id'))
                if admin and program:
                    AdminAssignment.objects.update_or_create(admin=admin, program=program, defaults={'assigned_by': user_map.get(row.get('assigned_by'))})

            room_map = {}
            for row in data['chat_rooms']:
                program = program_map.get(row.get('program_id'))
                if program:
                    room, _ = ChatRoom.objects.update_or_create(program=program, defaults={'name': row.get('name') or 'General Chat', 'is_locked': bool(row.get('is_locked'))})
                    room_map[row.get('id')] = room

            message_map = {}
            pending_replies = []
            for row in data['chat_messages']:
                room, user = room_map.get(row.get('room_id')), user_map.get(row.get('sender_id'))
                if room and user:
                    message = ChatMessage.objects.create(room=room, user=user, content=row.get('content') or '', sender_name=row.get('sender_name') or user.get_full_name() or user.username, is_deleted=bool(row.get('is_deleted')), is_pinned=bool(row.get('is_pinned')), deleted_by=user_map.get(row.get('deleted_by')))
                    message_map[row.get('id')] = message
                    pending_replies.append((message, row.get('reply_to_id')))
            for message, reply_id in pending_replies:
                if reply_id in message_map:
                    message.reply_to_id = message_map[reply_id]
                    message.save(update_fields=['reply_to_id'])

            for row in data['direct_messages']:
                sender, recipient = user_map.get(row.get('sender_id')), user_map.get(row.get('recipient_id'))
                if sender and recipient:
                    DirectMessage.objects.create(sender=sender, recipient=recipient, content=row.get('content') or '', is_deleted=bool(row.get('is_deleted')))

            for row in data['website_content']:
                if row.get('key'):
                    WebsiteContent.objects.update_or_create(key=row['key'], defaults={'content': row.get('content') or {}})

        self.stdout.write(self.style.SUCCESS('Supabase data imported into Django successfully. Imported passwords are unusable; users must reset them.'))

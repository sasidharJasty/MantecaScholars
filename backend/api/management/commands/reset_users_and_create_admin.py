from getpass import getpass

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import User


class Command(BaseCommand):
    help = 'Delete all Django users and create one approved Admin III superuser.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', help='Avoid passing this in shell history; omit to be prompted securely.')
        parser.add_argument('--confirm', action='store_true', help='Required because this deletes every user.')

    def handle(self, *args, **options):
        if not options['confirm']:
            raise CommandError('This deletes every user. Re-run with --confirm after verifying the email.')
        email = options['email'].strip().lower()
        password = options['password'] or getpass('New Admin III password: ')
        if len(password) < 8:
            raise CommandError('Password must be at least 8 characters.')
        with transaction.atomic():
            deleted, _ = User.objects.all().delete()
            admin = User.objects.create_superuser(username=email, email=email, password=password)
            admin.role = 'admin_iii'
            admin.account_status = 'approved'
            admin.full_name = 'System Administrator'
            admin.save(update_fields=['role', 'account_status', 'full_name'])
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} related records and created {email} as Admin III.'))

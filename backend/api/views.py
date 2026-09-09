from django.contrib.auth import authenticate
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Program, Roster, ChatRoom, ChatMessage, WebsiteContent, Event, DirectMessage, AdminAssignment
from .serializers import (
    UserSerializer, ProgramSerializer, RosterSerializer,
    ChatRoomSerializer, ChatMessageSerializer, WebsiteContentSerializer, EventSerializer,
    DirectMessageSerializer, AdminAssignmentSerializer
)

def csv_values(request, name):
    value = request.query_params.get(name)
    return [item for item in value.split(',') if item] if value else []


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        public_actions = {'create', 'register', 'login', 'reset_password', 'reset_password_confirm'}
        if self.action in public_actions or self.request.path.rstrip('/').endswith(('reset-password', 'reset-password-confirm')):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.all()
        account_status = self.request.query_params.get('account_status')
        if account_status:
            queryset = queryset.filter(account_status=account_status)
        user_id = self.request.query_params.get('id')
        if user_id:
            queryset = queryset.filter(id__in=csv_values(self.request, 'id'))
        return queryset

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username', email)
        user = User.objects.filter(email__iexact=email).first()
        if user:
            return Response({'detail': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={
            'username': username,
            'email': email,
            'password': password,
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', ''),
            'member_id': request.data.get('member_id'),
            'role': request.data.get('role', 'student'),
        })
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.account_status = 'pending'
        user.save(update_fields=['account_status'])
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenObtainPairSerializer(data={'username': user.username, 'password': password})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='reset-password')
    def reset_password(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email__iexact=email).first()
        response = {'detail': 'If an account exists for that email, password-reset instructions have been sent.'}
        if not user:
            return Response(response)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')}/auth?reset=true&uid={uid}&token={token}"
        send_mail('Reset your Manteca Scholars password', f'Use this link to reset your password: {reset_url}', settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        if settings.DEBUG:
            response.update({'uid': uid, 'token': token, 'reset_url': reset_url})
        return Response(response)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='reset-password-confirm')
    def reset_password_confirm(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uid or not token or not new_password:
            return Response({'detail': 'uid, token, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired password-reset link.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Password has been reset successfully.'})

    @action(detail=True, methods=['patch'])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

    def get_queryset(self):
        queryset = Program.objects.all()
        program_id = self.request.query_params.get('id')
        name = self.request.query_params.get('name')
        if program_id:
            queryset = queryset.filter(id__in=csv_values(self.request, 'id'))
        if name:
            queryset = queryset.filter(name=name)
        return queryset

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.all()
        program_id = self.request.query_params.get('program')
        if program_id:
            values = csv_values(self.request, 'program')
            queryset = queryset.filter(program_id__in=values)
        return queryset.order_by('event_date')

class RosterViewSet(viewsets.ModelViewSet):
    queryset = Roster.objects.all()
    serializer_class = RosterSerializer

    def get_queryset(self):
        queryset = Roster.objects.all()
        program_id = self.request.query_params.get('program')
        user_id = self.request.query_params.get('user')
        is_team_leader = self.request.query_params.get('is_team_leader')
        if program_id:
            queryset = queryset.filter(program_id__in=csv_values(self.request, 'program'))
        if user_id:
            queryset = queryset.filter(user_id__in=csv_values(self.request, 'user'))
        if is_team_leader is not None:
            queryset = queryset.filter(is_team_leader=is_team_leader.lower() in ('1', 'true', 'yes'))
        return queryset.order_by('joined_at')

    def perform_create(self, serializer):
        serializer.save()

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        queryset = ChatRoom.objects.all()
        program_id = self.request.query_params.get('program')
        if program_id:
            queryset = queryset.filter(program_id__in=csv_values(self.request, 'program'))
        return queryset.order_by('created_at')

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        queryset = ChatMessage.objects.all()
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id__in=csv_values(self.request, 'room'))
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, sender_name=self.request.user.get_full_name() or self.request.user.username)

class DirectMessageViewSet(viewsets.ModelViewSet):
    serializer_class = DirectMessageSerializer

    def get_queryset(self):
        if self.request.user.role == 'admin_iii':
            return DirectMessage.objects.all()
        return DirectMessage.objects.filter(sender=self.request.user) | DirectMessage.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class AdminAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AdminAssignment.objects.all()
    serializer_class = AdminAssignmentSerializer

    def get_queryset(self):
        queryset = AdminAssignment.objects.all()
        admin_id = self.request.query_params.get('admin_id')
        if admin_id:
            queryset = queryset.filter(admin_id__in=csv_values(self.request, 'admin_id'))
        return queryset

class WebsiteContentViewSet(viewsets.ModelViewSet):
    queryset = WebsiteContent.objects.all()
    serializer_class = WebsiteContentSerializer

    def get_queryset(self):
        queryset = WebsiteContent.objects.all()
        key = self.request.query_params.get('key')
        if key:
            queryset = queryset.filter(key=key)
        return queryset

    def create(self, request, *args, **kwargs):
        key = request.data.get('key')
        content = request.data.get('content')
        obj, created = WebsiteContent.objects.update_or_create(
            key=key,
            defaults={'content': content}
        )
        serializer = self.get_serializer(obj)
        return Response(serializer.data)

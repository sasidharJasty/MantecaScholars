from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.test import override_settings

from .models import Program


class DjangoApiIntegrationTests(APITestCase):
    def setUp(self):
        self.password = 'safe-test-password-123'
        self.user = get_user_model().objects.create_user(
            username='student@example.com', email='student@example.com', password=self.password,
            first_name='Test', last_name='Student', role='student', account_status='approved'
        )
        self.admin = get_user_model().objects.create_user(
            username='admin@example.com', email='admin@example.com', password=self.password,
            role='admin_iii', account_status='approved'
        )

    def authenticate(self, email='student@example.com'):
        response = self.client.post('/api/users/login/', {'email': email, 'password': self.password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_authentication_contract(self):
        response = self.client.post('/api/users/login/', {'email': self.user.email, 'password': self.password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        me = self.client.get('/api/users/me/')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['email'], self.user.email)

    def test_program_roster_event_and_chat_flow(self):
        self.authenticate()
        program = self.client.post('/api/programs/', {'name': 'Math League', 'description': 'Test'}, format='json')
        self.assertEqual(program.status_code, status.HTTP_201_CREATED)
        program_id = program.data['id']
        roster = self.client.post('/api/rosters/', {'program': program_id, 'user': self.user.id, 'is_team_leader': True}, format='json')
        self.assertEqual(roster.status_code, status.HTTP_201_CREATED)
        event = self.client.post('/api/events/', {'program_id': program_id, 'title': 'Practice', 'event_date': '2026-09-06T18:00:00Z'}, format='json')
        self.assertEqual(event.status_code, status.HTTP_201_CREATED, event.data)
        room = self.client.post('/api/chat-rooms/', {'program_id': program_id, 'name': 'General'}, format='json')
        self.assertEqual(room.status_code, status.HTTP_201_CREATED)
        message = self.client.post('/api/chat-messages/', {'room': room.data['id'], 'content': 'Hello Django'}, format='json')
        self.assertEqual(message.status_code, status.HTTP_201_CREATED)
        self.assertEqual(message.data['user'], self.user.id)
        listing = self.client.get(f"/api/chat-messages/?room={room.data['id']}")
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data[0]['content'], 'Hello Django')

    def test_direct_messages_and_website_content(self):
        self.authenticate()
        dm = self.client.post('/api/direct-messages/', {'recipient': self.admin.id, 'content': 'Hello admin'}, format='json')
        self.assertEqual(dm.status_code, status.HTTP_201_CREATED, dm.data)
        self.assertEqual(self.client.get('/api/direct-messages/').status_code, status.HTTP_200_OK)
        content = self.client.post('/api/website-content/', {'key': 'home_news', 'content': [{'title': 'Test'}]}, format='json')
        self.assertEqual(content.status_code, status.HTTP_200_OK)
        fetched = self.client.get('/api/website-content/?key=home_news')
        self.assertEqual(fetched.data[0]['content'][0]['title'], 'Test')

    def test_unauthenticated_api_is_protected(self):
        self.assertEqual(self.client.get('/api/programs/').status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(DEBUG=True, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_password_reset_request_and_confirmation(self):
        request = self.client.post('/api/users/reset-password/', {'email': self.user.email}, format='json')
        self.assertEqual(request.status_code, status.HTTP_200_OK, request.data)
        self.assertIn('token', request.data)
        confirm = self.client.post('/api/users/reset-password-confirm/', {
            'uid': request.data['uid'], 'token': request.data['token'], 'new_password': 'new-safe-password-123'
        }, format='json')
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        login = self.client.post('/api/users/login/', {'email': self.user.email, 'password': 'new-safe-password-123'}, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)

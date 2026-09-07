from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=50, default='student')
    full_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    member_id = models.CharField(max_length=100, blank=True, null=True)
    account_status = models.CharField(max_length=20, default='pending')

    def __str__(self):
        return self.username

class Program(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True, default='')
    info_content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Roster(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rosters')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='rosters')
    is_team_leader = models.BooleanField(default=False)
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'program')

class ChatRoom(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='chat_rooms')
    name = models.CharField(max_length=255)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.program.name} - {self.name}"

class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    sender_name = models.CharField(max_length=255, blank=True)
    is_deleted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='deleted_messages')
    reply_to_id = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"

class Event(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.program.name}"

class WebsiteContent(models.Model):
    key = models.CharField(max_length=255, unique=True)
    content = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key

class DirectMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_direct_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_direct_messages')
    content = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class AdminAssignment(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_assignments')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='admin_assignments')
    assigned_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('admin', 'program')

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    AdminAssignment, ChatMessage, ChatRoom, DirectMessage, Event,
    Program, Roster, User, WebsiteContent,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'account_status', 'is_staff', 'is_active')
    list_filter = ('role', 'account_status', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'member_id')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Manteca Scholars', {'fields': ('role', 'full_name', 'avatar_url', 'member_id', 'account_status', 'onboarding_completed')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Manteca Scholars', {'fields': ('email', 'role', 'account_status')}),
    )


for model in (Program, Roster, Event, ChatRoom, ChatMessage, DirectMessage, AdminAssignment, WebsiteContent):
    admin.site.register(model)

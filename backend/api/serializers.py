from rest_framework import serializers
from .models import User, Program, Roster, ChatRoom, ChatMessage, WebsiteContent, Event, DirectMessage, AdminAssignment

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'avatar_url', 'onboarding_completed', 'member_id',
            'account_status', 'password'
        ]
        read_only_fields = []

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.username = user.email or user.username
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    program_name = serializers.SerializerMethodField()
    program_id = serializers.PrimaryKeyRelatedField(source='program', queryset=Program.objects.all(), write_only=True, required=False)

    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {'program': {'required': False}}

    def get_program_name(self, obj):
        return obj.program.name if obj.program else None

class RosterSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    program_details = ProgramSerializer(source='program', read_only=True)

    class Meta:
        model = Roster
        fields = '__all__'

class ChatRoomSerializer(serializers.ModelSerializer):
    program_id = serializers.PrimaryKeyRelatedField(source='program', queryset=Program.objects.all(), write_only=True, required=False)
    class Meta:
        model = ChatRoom
        fields = '__all__'
        extra_kwargs = {'program': {'required': False}}

class ChatMessageSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    reply_to = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}

class DirectMessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    recipient_details = UserSerializer(source='recipient', read_only=True)

    class Meta:
        model = DirectMessage
        fields = '__all__'
        extra_kwargs = {'sender': {'read_only': True}}

class AdminAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminAssignment
        fields = '__all__'

class WebsiteContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteContent
        fields = '__all__'

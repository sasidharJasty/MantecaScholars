from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    UserViewSet, ProgramViewSet, EventViewSet, RosterViewSet,
    ChatRoomViewSet, ChatMessageViewSet, WebsiteContentViewSet, DirectMessageViewSet, AdminAssignmentViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'programs', ProgramViewSet)
router.register(r'events', EventViewSet)
router.register(r'rosters', RosterViewSet)
router.register(r'chat-rooms', ChatRoomViewSet)
router.register(r'chat-messages', ChatMessageViewSet)
router.register(r'website-content', WebsiteContentViewSet)
router.register(r'direct-messages', DirectMessageViewSet, basename='direct-message')
router.register(r'admin-assignments', AdminAssignmentViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

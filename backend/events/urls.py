from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostViewSet, PublicEventViewSet, DashboardViewSet, EventPanelViewSet, google_auth


router = DefaultRouter()
router.register(r'hostpanel', HostViewSet, basename='hostpanel')
router.register(r'eventboard', PublicEventViewSet, basename='eventboard')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'eventpanel', EventPanelViewSet, basename='eventpanel')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls')),
    path('auth/google/', google_auth, name='google-auth')
]
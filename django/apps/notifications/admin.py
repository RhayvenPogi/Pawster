from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ["id","user","notif_type","title","is_read","created_at"]
    list_filter   = ["notif_type","is_read"]
    search_fields = ["user__username","title"]
    readonly_fields = ["created_at"]
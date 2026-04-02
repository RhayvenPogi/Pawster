from django.contrib import admin
from .models import AdoptionRequest, RehomingRequest

@admin.register(AdoptionRequest)
class AdoptionRequestAdmin(admin.ModelAdmin):
    list_display   = ["id","name","animal_name","status","created_at"]
    list_filter    = ["status"]
    search_fields  = ["name","email","animal_name"]
    readonly_fields = ["created_at","updated_at","decided_at","adoption_date"]

@admin.register(RehomingRequest)
class RehomingRequestAdmin(admin.ModelAdmin):
    list_display  = ["id","pet_name","species","status","created_at"]
    list_filter   = ["status","species"]
    search_fields = ["pet_name","contact"]
    readonly_fields = ["created_at","updated_at","decided_at"]
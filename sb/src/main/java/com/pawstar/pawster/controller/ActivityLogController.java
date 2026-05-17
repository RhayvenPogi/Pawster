package com.pawstar.pawster.controller;

import com.pawstar.pawster.model.ActivityLog;
import com.pawstar.pawster.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    @Autowired
    private ActivityLogService activityLogService;

    // GET /api/admin/activity-logs  — recent 50 entries
    @GetMapping
    public List<ActivityLog> getRecent() {
        return activityLogService.getRecent();
    }

    // GET /api/admin/activity-logs?userId=5
    @GetMapping("/by-user")
    public List<ActivityLog> getByUser(@RequestParam Integer userId) {
        return activityLogService.getByUser(userId);
    }

    // POST /api/admin/activity-logs — log any action
    @PostMapping
    public java.util.Map<String, Object> log(@RequestBody java.util.Map<String, String> body) {
        String action  = body.getOrDefault("action",  "Download");
        String details = body.getOrDefault("details", "");
        activityLogService.log(action, details, null, "User");
        return java.util.Map.of("success", true);
    }
}
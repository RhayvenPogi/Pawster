package com.pawstar.pawster.service;

import com.pawstar.pawster.model.ActivityLog;
import com.pawstar.pawster.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /** Quick helper: log any action from any service/controller. */
    public void log(String action, String details, Integer userId, String userName) {
        ActivityLog entry = new ActivityLog();
        entry.setAction(action);
        entry.setDetails(details);
        entry.setUserId(userId);
        entry.setUserName(userName);
        activityLogRepository.save(entry);
    }

    public List<ActivityLog> getRecent() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public List<ActivityLog> getByUser(Integer userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
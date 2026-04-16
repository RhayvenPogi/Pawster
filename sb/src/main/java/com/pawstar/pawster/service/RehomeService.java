package com.pawstar.pawster.service;

import com.pawstar.pawster.model.RehomeRequest;
import com.pawstar.pawster.repository.RehomeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RehomeService {

    @Autowired
    private RehomeRepository rehomeRepository;

    @Autowired
    private ActivityLogService activityLogService;

    public RehomeRequest create(RehomeRequest req) {
        req.setStatus("Pending");
        RehomeRequest saved = rehomeRepository.save(req);
        activityLogService.log(
            "REHOME_REQUEST",
            "New rehome request for: " + req.getPetName() + " by " + req.getOwnerName(),
            req.getUserId(), req.getOwnerName()
        );
        return saved;
    }

    public List<RehomeRequest> getAll() {
        return rehomeRepository.findAll();
    }

    public List<RehomeRequest> getByUser(Integer userId) {
        return rehomeRepository.findByUserId(userId);
    }

    public List<RehomeRequest> getByStatus(String status) {
        return rehomeRepository.findByStatus(status);
    }

    public RehomeRequest getById(Integer id) {
        return rehomeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rehome request not found: " + id));
    }

    public RehomeRequest updateStatus(Integer id, String status, String rejectNote,
                                      Integer adminId, String adminName) {
        RehomeRequest req = getById(id);
        req.setStatus(status);
        if (rejectNote != null) req.setRejectNote(rejectNote);
        RehomeRequest saved = rehomeRepository.save(req);
        activityLogService.log(
            "REHOME_" + status.toUpperCase(),
            "Rehome request #" + id + " for " + req.getPetName() + " → " + status,
            adminId, adminName
        );
        return saved;
    }

    public void delete(Integer id) {
        rehomeRepository.deleteById(id);
    }
}
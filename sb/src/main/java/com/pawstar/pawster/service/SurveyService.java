package com.pawstar.pawster.service;

import com.pawstar.pawster.model.Survey;
import com.pawstar.pawster.repository.SurveyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SurveyService {

    @Autowired
    private SurveyRepository surveyRepository;

    @Autowired
    private ActivityLogService activityLogService;

    public Survey create(Survey survey) {
        Survey saved = surveyRepository.save(survey);
        activityLogService.log(
            "SURVEY_SUBMITTED",
            "Survey submitted by " + survey.getAdopterName()
                + " for " + survey.getAnimalName()
                + " — rating: " + survey.getRating(),
            survey.getUserId(), survey.getAdopterName()
        );
        return saved;
    }

    public List<Survey> getAll() {
        return surveyRepository.findAll();
    }

    public List<Survey> getByUser(Integer userId) {
        return surveyRepository.findByUserId(userId);
    }

    public Survey getById(Integer id) {
        return surveyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Survey not found: " + id));
    }
}
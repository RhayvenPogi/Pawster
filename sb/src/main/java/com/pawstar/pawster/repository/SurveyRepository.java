package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Integer> {

    List<Survey> findByUserId(Integer userId);

    List<Survey> findByAdoptionId(Integer adoptionId);
}
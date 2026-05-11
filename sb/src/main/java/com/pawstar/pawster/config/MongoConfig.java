package com.pawstar.pawster.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.pawstar.pawster.repository",
                       excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
                           type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
                           classes = com.pawstar.pawster.repository.MessageRepository.class
                       ))
@EnableMongoRepositories(basePackageClasses = com.pawstar.pawster.repository.MessageRepository.class)
public class MongoConfig {
}
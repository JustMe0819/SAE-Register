package com.mmi.meaux.sae_register.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SaeDTO {
    private Long id;
    private String code;
    private String name;
    private String year;
    private int semester;
    private String domain;
    private String ue;
    private String description;
    private String competences;
    private String dateDebut;
    private String dateFin;
    private String siteUrl;
    private String repoUrl;
    private String illustration;
    private Double tauxReussite;
    private List<StudentDTO> students;
    private StatsDTO stats;

    @Data
    @Builder
    public static class StudentDTO {
        private Long id;
        private String fullName;
        private Double grade;
        private String siteUrl;
        private String repoUrl;
    }

    @Data
    @Builder
    public static class StatsDTO {
        private int total;
        private int graded;
        private Double avg;
        private Double min;
        private Double max;
    }
}
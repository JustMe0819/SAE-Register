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
    private String siteUrl;
    private String repoUrl;
    private List<GroupDTO> groups;
    private StatsDTO stats;

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
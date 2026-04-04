package com.mmi.meaux.sae_register.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class GroupDTO {
    private Long id;
    private Double grade;
    private List<String> members;
}
package com.mmi.meaux.sae_register.service;

import com.mmi.meaux.sae_register.dto.GroupDTO;
import com.mmi.meaux.sae_register.dto.SaeDTO;
import com.mmi.meaux.sae_register.entity.Sae;
import com.mmi.meaux.sae_register.entity.SaeGroup;
import com.mmi.meaux.sae_register.repository.SaeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
public class SaeService {

    private final SaeRepository saeRepository;

    public List<SaeDTO> getAll(String year, String domain) {
        List<Sae> saes;
        if (year != null && domain != null)   saes = saeRepository.findByYearAndDomain(year, domain);
        else if (year != null)                saes = saeRepository.findByYear(year);
        else if (domain != null)              saes = saeRepository.findByDomain(domain);
        else                                  saes = saeRepository.findAll();
        return saes.stream().map(this::toDTO).toList();
    }

    public SaeDTO getById(Long id) {
        Sae sae = saeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SAé introuvable : " + id));
        return toDTO(sae);
    }

    private SaeDTO toDTO(Sae sae) {
        List<GroupDTO> groups = sae.getGroups().stream().map(g -> GroupDTO.builder()
                .id(g.getId())
                .grade(g.getGrade())
                .members(g.getStudents().stream().map(s -> s.getFullName()).toList())
                .build()
        ).toList();

        // Stats
        List<Double> grades = groups.stream()
                .filter(g -> g.getGrade() != null)
                .map(GroupDTO::getGrade)
                .toList();

        int total  = groups.stream().mapToInt(g -> g.getMembers().size()).sum();
        int graded = (int) sae.getGroups().stream()
                .filter(g -> g.getGrade() != null)
                .flatMap(g -> g.getStudents().stream())
                .count();

        OptionalDouble avg = grades.stream().mapToDouble(Double::doubleValue).average();
        OptionalDouble min = grades.stream().mapToDouble(Double::doubleValue).min();
        OptionalDouble max = grades.stream().mapToDouble(Double::doubleValue).max();

        return SaeDTO.builder()
                .id(sae.getId())
                .code(sae.getCode())
                .name(sae.getName())
                .year(sae.getYear())
                .semester(sae.getSemester())
                .domain(sae.getDomain())
                .ue(sae.getUe())
                .description(sae.getDescription())
                .siteUrl(sae.getSiteUrl())
                .repoUrl(sae.getRepoUrl())
                .groups(groups)
                .stats(SaeDTO.StatsDTO.builder()
                        .total(total)
                        .graded(graded)
                        .avg(avg.isPresent() ? Math.round(avg.getAsDouble() * 100.0) / 100.0 : null)
                        .min(min.isPresent() ? min.getAsDouble() : null)
                        .max(max.isPresent() ? max.getAsDouble() : null)
                        .build())
                .build();
    }
}
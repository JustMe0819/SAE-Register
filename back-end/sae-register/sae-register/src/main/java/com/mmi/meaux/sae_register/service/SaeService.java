package com.mmi.meaux.sae_register.service;

import com.mmi.meaux.sae_register.dto.SaeDTO;
import com.mmi.meaux.sae_register.dto.SaeDTO.StudentDTO;
import com.mmi.meaux.sae_register.entity.Sae;
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
        List<StudentDTO> students = sae.getStudents().stream().map(s -> StudentDTO.builder()
                .id(s.getId())
                .fullName(s.getFullName())
                .grade(s.getGrade())
                .siteUrl(s.getSiteUrl())
                .repoUrl(s.getRepoUrl())
                .build()
        ).toList();

        List<Double> grades = students.stream()
                .filter(s -> s.getGrade() != null)
                .map(StudentDTO::getGrade)
                .toList();

        int total  = students.size();
        int graded = (int) students.stream()
                .filter(s -> s.getGrade() != null)
                .count();

        OptionalDouble avg = grades.stream().mapToDouble(Double::doubleValue).average();
        OptionalDouble min = grades.stream().mapToDouble(Double::doubleValue).min();
        OptionalDouble max = grades.stream().mapToDouble(Double::doubleValue).max();

        double tauxReussite = graded > 0
            ? (double) students.stream()
                .filter(s -> s.getGrade() != null && s.getGrade() >= 10)
                .count() / graded * 100
            : 0.0;

        return SaeDTO.builder()
                .id(sae.getId())
                .code(sae.getCode())
                .name(sae.getName())
                .year(sae.getYear())
                .semester(sae.getSemester())
                .domain(sae.getDomain())
                .ue(sae.getUe())
                .description(sae.getDescription())
                .competences(sae.getCompetences())
                .dateDebut(sae.getDateDebut())
                .dateFin(sae.getDateFin())
                .siteUrl(sae.getSiteUrl())
                .repoUrl(sae.getRepoUrl())
                .illustration(sae.getIllustration())
                .tauxReussite(Math.round(tauxReussite * 100.0) / 100.0)
                .students(students)
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
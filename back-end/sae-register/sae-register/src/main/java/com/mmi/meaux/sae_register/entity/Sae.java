package com.mmi.meaux.sae_register.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sae")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sae {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String year;

    private int semester;

    private String domain;

    private String ue;

    private String description;

    private String competences;

    private String dateDebut;

    private String dateFin;

    private String illustration;

    private Double tauxReussite;

    @OneToMany(mappedBy = "sae", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Student> students = new ArrayList<>();
}
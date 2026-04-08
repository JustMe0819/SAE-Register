package com.mmi.meaux.sae_register.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    private Double grade;

    private String siteUrl;

    private String repoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sae_id", nullable = false)
    @ToString.Exclude
    private Sae sae;
}
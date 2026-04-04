package com.mmi.meaux.sae_register.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sae_group")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaeGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double grade;       

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sae_id", nullable = false)
    @ToString.Exclude
    private Sae sae;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Student> students = new ArrayList<>();
}
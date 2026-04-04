package com.mmi.meaux.sae_register.repository;

import com.mmi.meaux.sae_register.entity.Sae;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SaeRepository extends JpaRepository<Sae, Long> {
    List<Sae> findByYear(String year);
    List<Sae> findByDomain(String domain);
    List<Sae> findByYearAndDomain(String year, String domain);
}
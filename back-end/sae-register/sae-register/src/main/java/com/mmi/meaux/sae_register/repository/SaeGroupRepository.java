package com.mmi.meaux.sae_register.repository;

import com.mmi.meaux.sae_register.entity.SaeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SaeGroupRepository extends JpaRepository<SaeGroup, Long> {
    List<SaeGroup> findBySaeId(Long saeId);
}
package com.netguard.ids.repository;

import com.netguard.ids.entity.BlacklistedIP;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlacklistedIPRepository extends JpaRepository<BlacklistedIP, Long> {

    Optional<BlacklistedIP> findByIp(String ip);

    boolean existsByIp(String ip);
}

package com.mmi.meaux.sae_register.controller;

import com.mmi.meaux.sae_register.dto.SaeDTO;
import com.mmi.meaux.sae_register.service.SaeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SaeController {

    private final SaeService saeService;

    // GET /api/saes
    // GET /api/saes?year=MMI3
    // GET /api/saes?domain=Web
    // GET /api/saes?year=MMI3&domain=Web
    @GetMapping
    public ResponseEntity<List<SaeDTO>> getAll(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String domain) {
        return ResponseEntity.ok(saeService.getAll(year, domain));
    }

    // GET /api/saes/1
    @GetMapping("/{id}")
    public ResponseEntity<SaeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(saeService.getById(id));
    }

    // PUT /api/saes/students/1
    @PutMapping("/students/{id}")
    public ResponseEntity<Void> updateStudent(@PathVariable Long id, @RequestBody UpdateStudentRequest request) {
        saeService.updateStudent(id, request.siteUrl(), request.repoUrl());
        return ResponseEntity.ok().build();
    }
}

record UpdateStudentRequest(String siteUrl, String repoUrl) {}
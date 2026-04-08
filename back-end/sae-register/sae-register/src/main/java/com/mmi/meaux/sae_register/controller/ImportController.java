package com.mmi.meaux.sae_register.controller;

import com.mmi.meaux.sae_register.dto.SaeDTO;
import com.mmi.meaux.sae_register.entity.Sae;
import com.mmi.meaux.sae_register.service.ImportService;
import com.mmi.meaux.sae_register.service.SaeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;
    private final SaeService saeService;

    @PostMapping
    public ResponseEntity<SaeDTO> importFile(
            @RequestParam("file")                                    MultipartFile file,
            @RequestParam("code")                                    String code,
            @RequestParam("name")                                    String name,
            @RequestParam("year")                                    String year,
            @RequestParam("semester")                                String semesterStr,
            @RequestParam("domain")                                  String domain,
            @RequestParam("ue")                                      String ue,
            @RequestParam(value = "description",  defaultValue = "") String description,
            @RequestParam(value = "competences",  defaultValue = "") String competences,
            @RequestParam(value = "dateDebut",    defaultValue = "") String dateDebut,
            @RequestParam(value = "dateFin",      defaultValue = "") String dateFin,
            @RequestParam(value = "illustration", required = false) MultipartFile illustration
    ) {
        try {
            int semester = Integer.parseInt(semesterStr);
            Sae sae = importService.importFile(
                file, code, name, year, semester, domain, ue,
                description, competences, dateDebut, dateFin, illustration
            );
            return ResponseEntity.ok(saeService.getById(sae.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
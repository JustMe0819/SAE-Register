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

    // POST /api/import
    // multipart/form-data :
    //   file       → le fichier XLSX ou PDF
    //   code       → "SAé 303"
    //   name       → "Conception de documents web"
    //   year       → "MMI2" ou "MMI3"
    //   semester   → 3
    //   domain     → "Web"
    //   ue         → "UE3.1"
    //   description → (optionnel)
    @PostMapping
    public ResponseEntity<SaeDTO> importFile(
            @RequestParam("file")        MultipartFile file,
            @RequestParam("code")        String code,
            @RequestParam("name")        String name,
            @RequestParam("year")        String year,
            @RequestParam("semester")    int semester,
            @RequestParam("domain")      String domain,
            @RequestParam("ue")          String ue,
            @RequestParam(value = "description", defaultValue = "") String description
    ) {
        try {
            Sae sae = importService.importFile(file, code, name, year, semester, domain, ue, description);
            return ResponseEntity.ok(saeService.getById(sae.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
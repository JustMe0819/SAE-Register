package com.mmi.meaux.sae_register.service;

import com.mmi.meaux.sae_register.entity.*;
import com.mmi.meaux.sae_register.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;

@Service
@RequiredArgsConstructor
public class ImportService {

    private final SaeRepository saeRepository;
    private final SaeGroupRepository groupRepository;
    private final StudentRepository studentRepository;

    public Sae importFile(MultipartFile file, String code, String name,
                          String year, int semester, String domain, String ue,
                          String description, String competences,
                          String dateDebut, String dateFin,
                          String siteUrl, String repoUrl) throws IOException {

        Sae sae = Sae.builder()
                .code(code).name(name).year(year)
                .semester(semester).domain(domain)
                .ue(ue).description(description)
                .competences(competences)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .siteUrl(siteUrl)
                .repoUrl(repoUrl)
                .build();
        sae = saeRepository.save(sae);

        List<RawRow> rows = parseFile(file);

        Map<String, List<String>> buckets = new LinkedHashMap<>();
        for (RawRow row : rows) {
            String key = row.grade() == null ? "__null_" + row.fullName() : String.valueOf(row.grade());
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(row.fullName());
        }

        for (Map.Entry<String, List<String>> entry : buckets.entrySet()) {
            String key = entry.getKey();
            Double grade = key.startsWith("__null_") ? null : parseGrade(key);

            SaeGroup group = SaeGroup.builder().grade(grade).sae(sae).build();
            group = groupRepository.save(group);

            for (String member : entry.getValue()) {
                studentRepository.save(Student.builder().fullName(member).group(group).build());
            }
        }
        return sae;
    }

    private List<RawRow> parseFile(MultipartFile file) throws IOException {
        String fn = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (fn.endsWith(".pdf"))                         return parsePDF(file);
        if (fn.endsWith(".xlsx") || fn.endsWith(".xls")) return parseXLSX(file);
        throw new IllegalArgumentException("Format non supporté. Utilisez XLSX ou PDF.");
    }

    private List<RawRow> parseXLSX(MultipartFile file) throws IOException {
        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Row header = sheet.getRow(0);
            int colNom = -1, colPrenom = -1, colNote = -1;

            for (Cell cell : header) {
                String h = cell.getStringCellValue().trim().toLowerCase();
                if (h.equals("nom"))                               colNom    = cell.getColumnIndex();
                else if (h.equals("prénom") || h.equals("prenom")) colPrenom = cell.getColumnIndex();
                else if (h.equals("note") || h.equals("grade"))    colNote   = cell.getColumnIndex();
            }
            if (colNom == -1 || colNote == -1)
                throw new IllegalArgumentException("Colonnes 'Nom' et/ou 'Note' introuvables.");

            List<RawRow> rows = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String nom    = getCellString(row.getCell(colNom));
                String prenom = colPrenom >= 0 ? getCellString(row.getCell(colPrenom)) : "";
                String full   = prenom.isEmpty() ? nom : (nom + " " + prenom).trim();
                if (full.isEmpty()) continue;
                rows.add(new RawRow(full, getCellGrade(row.getCell(colNote))));
            }
            return rows;
        }
    }

    private List<RawRow> parsePDF(MultipartFile file) throws IOException {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            String text = new PDFTextStripper().getText(doc);
            List<RawRow> rows = new ArrayList<>();
            Pattern p = Pattern.compile("^(.+?)\\s+(\\d{1,2}[,.]?\\d*|CAN|ABI)$", Pattern.CASE_INSENSITIVE);
            for (String line : text.split("\n")) {
                line = line.trim();
                if (line.isEmpty() || line.toLowerCase().startsWith("nom")) continue;
                Matcher m = p.matcher(line);
                if (m.matches()) rows.add(new RawRow(m.group(1).trim(), parseGrade(m.group(2))));
            }
            return rows;
        }
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().replace("\u00a0", " ").trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> "";
        };
    }

    private Double getCellGrade(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING  -> parseGrade(cell.getStringCellValue());
            default      -> null;
        };
    }

    private Double parseGrade(String raw) {
        if (raw == null) return null;
        String s = raw.trim().toUpperCase();
        if (s.isEmpty() || s.equals("CAN") || s.equals("ABI") || s.equals("ABJ")) return null;
        try { return Double.parseDouble(s.replace(",", ".")); }
        catch (NumberFormatException e) { return null; }
    }

    private record RawRow(String fullName, Double grade) {}
}
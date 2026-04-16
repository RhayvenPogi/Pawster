package com.pawstar.pawster.dto;

import com.pawstar.pawster.model.Animal;
import java.util.Base64;

public class AnimalDto {

    private Integer id;
    private String  name;
    private String  type;
    private String  breed;
    private String  age;
    private String  health;
    private String  status;
    private String  notes;
    private String  photoData;   // base64, no data: prefix
    private String  photoType;   // e.g. "image/jpeg"

    public static AnimalDto from(Animal a) {
        AnimalDto dto = new AnimalDto();
        dto.id        = a.getId();
        dto.name      = a.getName();
        dto.type      = a.getType();
        dto.breed     = a.getBreed();
        dto.age       = a.getAge();
        dto.health    = a.getHealth();
        dto.status    = a.getStatus();
        dto.notes     = a.getNotes();
        dto.photoType = a.getPhotoType();
        if (a.getPhotoData() != null) {
            dto.photoData = Base64.getEncoder().encodeToString(a.getPhotoData());
        }
        return dto;
    }

    public Integer getId()        { return id; }
    public String  getName()      { return name; }
    public String  getType()      { return type; }
    public String  getBreed()     { return breed; }
    public String  getAge()       { return age; }
    public String  getHealth()    { return health; }
    public String  getStatus()    { return status; }
    public String  getNotes()     { return notes; }
    public String  getPhotoData() { return photoData; }
    public String  getPhotoType() { return photoType; }
}
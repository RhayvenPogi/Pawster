package com.pawstar.pawster.service;


import org.springframework.stereotype.Component;


import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class PendingOtpStore {


    private static final long TTL_SECONDS = 600;


    private record Entry(String otp, String firstName, Instant expiry) {}


    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();


    public void save(String email, String otp, String firstName) {
        store.put(email.toLowerCase(),
                  new Entry(otp, firstName, Instant.now().plusSeconds(TTL_SECONDS)));
    }


    public boolean verify(String email, String otp) {
        Entry entry = store.get(email.toLowerCase());
        if (entry == null || Instant.now().isAfter(entry.expiry())) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (!entry.otp().equals(otp)) {
            return false;
        }
        store.remove(email.toLowerCase());
        return true;
    }


    public boolean exists(String email) {
        Entry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiry())) {
            store.remove(email.toLowerCase());
            return false;
        }
        return true;
    }


    public String getFirstName(String email) {
        Entry entry = store.get(email.toLowerCase());
        return entry != null ? entry.firstName() : "there";
    }
}


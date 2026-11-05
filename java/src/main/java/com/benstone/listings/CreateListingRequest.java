package com.benstone.listings;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Request body for creating a listing, parsed from JSON and validated here.
 *
 * <p>Validation runs before any business logic: a bad request is a 400 with
 * per-field messages, never a half-created row and never a 500. The rules
 * mirror the bean-validation version of this service: title/description
 * required and length-capped, category/currency must be known enum values,
 * reward must be a positive number with at most 12 integer and 9 fraction digits.
 */
public record CreateListingRequest(
        String title,
        String description,
        Listing.Category category,
        BigDecimal rewardAmount,
        Listing.Currency currency) {

    /** Parses {@code body} and returns either the request or the field errors. */
    public static ValidationResult parse(Map<String, Object> body) {
        Map<String, String> errors = new LinkedHashMap<>();

        String title = asString(body.get("title"));
        if (title == null || title.isBlank()) {
            errors.put("title", "title must not be blank");
        } else if (title.length() > 120) {
            errors.put("title", "title must be at most 120 characters");
        }

        String description = asString(body.get("description"));
        if (description == null || description.isBlank()) {
            errors.put("description", "description must not be blank");
        } else if (description.length() > 5000) {
            errors.put("description", "description must be at most 5000 characters");
        }

        Listing.Category category = null;
        String categoryRaw = asString(body.get("category"));
        if (categoryRaw == null) {
            errors.put("category", "category is required");
        } else {
            try {
                category = Listing.Category.valueOf(categoryRaw);
            } catch (IllegalArgumentException e) {
                errors.put("category", "unknown category: " + categoryRaw);
            }
        }

        BigDecimal reward = null;
        Object rewardRaw = body.get("rewardAmount");
        if (rewardRaw == null) {
            errors.put("rewardAmount", "rewardAmount is required");
        } else if (rewardRaw instanceof BigDecimal amount) {
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                errors.put("rewardAmount", "rewardAmount must be greater than zero");
            } else if (amount.precision() - amount.scale() > 12 || Math.max(0, amount.scale()) > 9) {
                errors.put("rewardAmount", "rewardAmount has too many digits");
            } else {
                reward = amount;
            }
        } else {
            errors.put("rewardAmount", "rewardAmount must be a number");
        }

        Listing.Currency currency = null;
        String currencyRaw = asString(body.get("currency"));
        if (currencyRaw == null) {
            errors.put("currency", "currency is required");
        } else {
            try {
                currency = Listing.Currency.valueOf(currencyRaw);
            } catch (IllegalArgumentException e) {
                errors.put("currency", "unknown currency: " + currencyRaw);
            }
        }

        if (!errors.isEmpty()) {
            return new ValidationResult(null, errors);
        }
        return new ValidationResult(
                new CreateListingRequest(title, description, category, reward, currency), Map.of());
    }

    private static String asString(Object value) {
        return value instanceof String s ? s : null;
    }

    public record ValidationResult(CreateListingRequest request, Map<String, String> errors) {
        public boolean valid() {
            return request != null;
        }
    }
}

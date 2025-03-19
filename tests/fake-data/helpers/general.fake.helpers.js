import { faker } from "@faker-js/faker";

export function generateTitle() {
    const verb = faker.hacker.ingverb();
    return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
}

export function generateDescription() {
    return faker.hacker.phrase();
}
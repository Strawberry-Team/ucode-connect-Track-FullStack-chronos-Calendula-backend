import { faker } from "@faker-js/faker";

export const COLORS = [
    '#AD1457', '#E4C441', '#0B8043', '#3F51B5', '#8E24AA',
    '#D81B60', '#C0CA33', '#009688', '#7986CB', '#795548',
    '#D50000', '#7CB342', '#039BE5', '#B39DDB', '#616161',
    '#E67C73', '#33B679', '#4285F4', '#9E69AF', '#A79B8E'
];

export function generateTitle() {
    const verb = faker.hacker.ingverb();
    return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
}

export function generateDescription() {
    return faker.hacker.phrase();
}

export function generateColor() {
    return faker.helpers.arrayElement(COLORS);
}
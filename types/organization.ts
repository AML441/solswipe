export enum tagTypes {
    Education,
    Health,
    Environment,
    AnimalWelfare,
    HumanRights,
    Tech,
    Media,
    Finance,
    Food,
    Other
    }

export interface Organization {
    name: string,
    description: string,
    tags: tagTypes[],
    contact: string
}
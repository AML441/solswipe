export enum tagTypes {
  Education = "Education",
  Health = "Health",
  Environment = "Environment",
  AnimalWelfare = "AnimalWelfare",
  HumanRights = "HumanRights",
  Tech = "Tech",
  Media = "Media",
  Finance = "Finance",
  Food = "Food",
  Other = "Other",
}

export interface Organization {
    id: string,
    name: string,
    description: string,
    tags: tagTypes[],
    contact: string,
    address: string
}
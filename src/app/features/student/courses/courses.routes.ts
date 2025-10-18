import { Routes } from "@angular/router";
import { StudentCoursesComponent } from "./student-courses.component";
import { ClassDetailsComponent } from "./class-details.component";

export const coursesRoutes: Routes = [
  {
    path: "",
    component: StudentCoursesComponent,
  },
  {
    path: ":id",
    component: ClassDetailsComponent,
  },
];

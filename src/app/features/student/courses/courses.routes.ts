import { Routes } from "@angular/router";
import { StudentCoursesComponent } from "./student-courses.component";
import { CourseDetailsComponent } from "./course-details.component";

export const coursesRoutes: Routes = [
  {
    path: "",
    component: StudentCoursesComponent,
  },
  {
    path: ":id",
    component: CourseDetailsComponent,
  },
];

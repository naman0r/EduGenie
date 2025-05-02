# this is the file for the canvas infrastructure and that aspect of the application:

- Only a root-account admin can issue a Canvas Developer Key (client ID / secret). this means we have to email the northeastern tech admin for this (which is dumb, and there is an alternative way to tackle this)
- I can spin up a free Canvas test instance at canvas.instructure.com, where I am the admin, or 2) ask users to paste personal “access tokens” instead of using OAuth (works, but UX is garbage).

I am continuing with way 2 (asking users to paste their own personal access token, even though the UX is garbage)

## what I can do with the personal access token:

YOOOOOOOOOO

curl -X GET -H "Content-Type: application/json" -d '{"google_id": "--"}' http://localhost:8000/canvas/courses

```json
[
  {
    "account_id": 76,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_2kjrdKiFhn4lIEl5gavm6ULNwgVzZvlDLI9TATFF.ics"
    },
    "course_code": "Khoury.Coop.2024.2025",
    "course_color": null,
    "created_at": "2024-08-19T20:04:26Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 1,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 198899,
    "is_public": false,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "2024-2025 Khoury First Year Experiential Learning Guide",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "2kjrdKiFhn4lIEl5gavm6ULNwgVzZvlDLI9TATFF",
    "workflow_state": "available"
  },
  {
    "account_id": 590,
    "apply_assignment_group_weights": true,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_37nKSabBOztFYrSgburbu2rwjo8CFvSp1wEf6fBq.ics"
    },
    "course_code": "ACCT1201.11842.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:58:01Z",
    "default_view": "modules",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": 80,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 186340,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "ACCT1201 11842 Fin Accounting&Reporting SEC 12 Fall 2024 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "37nKSabBOztFYrSgburbu2rwjo8CFvSp1wEf6fBq",
    "workflow_state": "available"
  },
  {
    "account_id": 75,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_HlpcyKXIQXdfmI5KYF3Dg2VPkXMBnlWYWxzzArlq.ics"
    },
    "course_code": "BUSN 0302",
    "course_color": null,
    "created_at": "2024-07-24T19:00:44Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 240,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 198247,
    "is_public": false,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "BUSN 0302: Leveraging AI for Business",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": true,
    "root_account_id": 1,
    "start_at": "2024-10-16T20:00:00Z",
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "HlpcyKXIQXdfmI5KYF3Dg2VPkXMBnlWYWxzzArlq",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": true,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_UTQ7tkazeOTWAWzbyTLB5bzFSVuQZhhErXHYPFnw.ics"
    },
    "course_code": "CS1200.21701.202510",
    "course_color": null,
    "course_format": "online",
    "created_at": "2024-05-15T14:58:50Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 187809,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "CS1200 21701 First Year Seminar SEC 01 Fall 2024 [VTL-1-OL]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "UTQ7tkazeOTWAWzbyTLB5bzFSVuQZhhErXHYPFnw",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_n4pOatJ2Uq1beVa9yJhQDn5ZccpFgOr9uxolhPZa.ics"
    },
    "course_code": "CS1800.MERGED.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:58:52Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 187849,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": "private",
    "locale": "en",
    "name": "CS1800 Fall 2024 (sections 2-5)",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "n4pOatJ2Uq1beVa9yJhQDn5ZccpFgOr9uxolhPZa",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_O9pErcQLzySMuUy278WCO3Xrp7dg4F3YjJeBLvmH.ics"
    },
    "course_code": "CS1802.14328.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:58:55Z",
    "default_view": "modules",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 187999,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "CS1802 14328 Seminar for CS 1800 SEC 53 Fall 2024 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "O9pErcQLzySMuUy278WCO3Xrp7dg4F3YjJeBLvmH",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_IRTkyr5BC0walvgSp71btNxCT7tJ08JGs0DNTqoH.ics"
    },
    "course_code": "CS2500.11412.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:58:59Z",
    "default_view": "syllabus",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 188171,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "CS2500 11412 Fundamentals of Computer Sci 1 SEC 07 Fall 2024 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "IRTkyr5BC0walvgSp71btNxCT7tJ08JGs0DNTqoH",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_WgbMIjCxPngGcttt4hl2tpE6naUJV9yr9dFoRMXo.ics"
    },
    "course_code": "CS2501.MERGED.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:59:00Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 188211,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "CS2501 Lab MERGED Fall 2024",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "WgbMIjCxPngGcttt4hl2tpE6naUJV9yr9dFoRMXo",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_GCisNuHgmJIXTMk9KB9tu9ruTQUD0akO2yqbHmvp.ics"
    },
    "course_code": "CS2510.34162.202530",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-09-23T05:32:05Z",
    "default_view": "syllabus",
    "end_at": null,
    "enrollment_term_id": 715,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 202304,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "CS2510 34162 Fundamentals of Computer Sci 2 SEC 05 Spring 2025 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "GCisNuHgmJIXTMk9KB9tu9ruTQUD0akO2yqbHmvp",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_V86RRdVuotB0FlZqNalEAYI68Gchxm74ZFhjb7T6.ics"
    },
    "course_code": "CS2511.MERGED.202530",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-09-23T05:31:56Z",
    "default_view": "syllabus",
    "end_at": null,
    "enrollment_term_id": 715,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 201931,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "CS2511 MERGED Spring 2025",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "V86RRdVuotB0FlZqNalEAYI68Gchxm74ZFhjb7T6",
    "workflow_state": "available"
  },
  {
    "account_id": 664,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_np5SJc87Rt9nNzU9Pt9WGArDfNzEzJuFYRI50uzp.ics"
    },
    "course_code": "CS3200.41222.202530",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-11-13T20:37:21Z",
    "default_view": "assignments",
    "end_at": null,
    "enrollment_term_id": 715,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 212445,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "CS3200 41222 Introduction to Databases SEC 34 Spring 2025 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "np5SJc87Rt9nNzU9Pt9WGArDfNzEzJuFYRI50uzp",
    "workflow_state": "available"
  },
  {
    "account_id": 788,
    "apply_assignment_group_weights": true,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_NK1bA0dZVkCsTmpEqlBNXoRiZcpI6BDJr3CRTlK9.ics"
    },
    "course_code": "ENGW1111.11336.202510",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-05-15T14:59:08Z",
    "default_view": "syllabus",
    "end_at": null,
    "enrollment_term_id": 702,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 188445,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "ENGW1111 11336 First-Year Writing SEC 01 Fall 2024 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "NK1bA0dZVkCsTmpEqlBNXoRiZcpI6BDJr3CRTlK9",
    "workflow_state": "available"
  },
  {
    "account_id": 599,
    "apply_assignment_group_weights": true,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_06ydDyT6n92EpBVGSWeg979bUEJ4Lh94GjlOlBdP.ics"
    },
    "course_code": "FINA2201.40675.202530",
    "course_color": null,
    "course_format": "on_campus",
    "created_at": "2024-10-11T17:21:24Z",
    "default_view": "modules",
    "end_at": null,
    "enrollment_term_id": 715,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 211449,
    "is_public": null,
    "is_public_to_auth_users": false,
    "license": null,
    "name": "FINA2201 40675 Financial Management SEC 20 Spring 2025 [BOS-1-TR]",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": null,
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "06ydDyT6n92EpBVGSWeg979bUEJ4Lh94GjlOlBdP",
    "workflow_state": "available"
  },
  {
    "account_id": 76,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_qlE7C0ASPZdit3GSZALa05VFsxWQ3dLANaQbcqnY.ics"
    },
    "course_code": "Khoury.Orientation.NU",
    "course_color": null,
    "created_at": "2020-10-16T14:02:38Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 1,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 58605,
    "is_public": false,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "Khoury Orientation",
    "overridden_course_visibility": "",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": "2020-10-23T14:30:00Z",
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "qlE7C0ASPZdit3GSZALa05VFsxWQ3dLANaQbcqnY",
    "workflow_state": "available"
  },
  {
    "account_id": 93,
    "apply_assignment_group_weights": false,
    "blueprint": false,
    "calendar": {
      "ics": "https://northeastern.instructure.com/feeds/calendars/course_CUToiuuL16PK08eEXjuTOsGXPLX9jOiQTPCuVmoV.ics"
    },
    "course_code": "CCIS.Advising.UG",
    "course_color": null,
    "created_at": "2020-09-18T16:33:56Z",
    "default_view": "wiki",
    "end_at": null,
    "enrollment_term_id": 1,
    "enrollments": [
      {
        "enrollment_state": "active",
        "limit_privileges_to_course_section": false,
        "role": "StudentEnrollment",
        "role_id": 3,
        "type": "student",
        "user_id": 339081
      }
    ],
    "friendly_name": null,
    "grade_passback_setting": null,
    "grading_standard_id": null,
    "hide_final_grades": false,
    "homeroom_course": false,
    "id": 58145,
    "is_public": false,
    "is_public_to_auth_users": false,
    "license": "private",
    "name": "Khoury Student Services",
    "overridden_course_visibility": "",
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "restrict_enrollments_to_course_dates": false,
    "root_account_id": 1,
    "start_at": "2020-09-23T19:37:00Z",
    "storage_quota_mb": 10485,
    "template": false,
    "time_zone": "America/New_York",
    "uuid": "CUToiuuL16PK08eEXjuTOsGXPLX9jOiQTPCuVmoV",
    "workflow_state": "available"
  }
]
```

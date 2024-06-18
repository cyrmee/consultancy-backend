# Consultancy - Database Models README

This README provides an overview of the database models defined in the Prisma schema for the Consultancy Backend project.

## Models

### 1. User

- **Fields:**
  - `id`: Unique identifier for the user.
  - `email`: Unique email address for the user.
  - `roles`: Array of user roles (Admin, Student, Agent).
  - `hash`: User password hash.
  - `isDeactivated`: Indicates if the user account is deactivated.
  - `isDeleted`: Indicates if the user account is deleted.
  - `createdAt`: Timestamp for user creation.
  - `updatedAt`: Timestamp for last user update.
- **Relations:**
  - `student`: One-to-One relation with the Student model.
  - `employee`: One-to-Many relation with the Employee model.

### 2. Student

- **Fields:**

  - `id`: Unique identifier for the student.
  - `firstName`, `lastName`: Student's first and last names.
  - `gender`: Enum representing the student's gender.
  - `phoneNumber`: Optional unique phone number.
  - `dateOfBirth`: Date of birth for the student.
  - `birthOfPlace`: Place of birth for the student.
  - `image`: Path to the student's image.
  - `passportNumber`, `IssueDate`, `ExpiryDate`: Passport information.
  - `passport`: Path to the passport image.
  - `isPhoneNumberVerified`: Indicates if the phone number is verified.
  - `createdAt`, `updatedAt`: Timestamps for student creation and last update.

- **Relations:**
  - `user`: One-to-One relation with the User model.
  - `agent`: Many-to-One relation with the Employee model.
  - `studentAddress`: One-to-One relation with the StudentAddress model.
  - `educationBackground`: One-to-Many relation with the EducationBackground model.
  - `studentRelations`: One-to-Many relation with the StudentRelations model.

### 3. StudentAddress

- **Fields:**

  - `id`: Unique identifier for the student address.
  - `region`, `subCity`, `woreda`, `kebele`: Address components.
  - `houseNumber`: House number in the address.
  - `createdAt`, `updatedAt`: Timestamps for address creation and last update.

- **Relations:**
  - `student`: One-to-One relation with the Student model.

### 4. StudentRelations

- **Fields:**

  - `id`: Unique identifier for student relations.
  - `firstName`, `lastName`: Relation's first and last names.
  - `phoneNumber`: Optional phone number for the relation.
  - `relationship`: Enum representing the relationship (Brother, Sister, Mother, Father).
  - `createdAt`, `updatedAt`: Timestamps for relation creation and last update.

- **Relations:**
  - `student`: Many-to-One relation with the Student model.

### 5. EducationBackground

- **Fields:**

  - `id`: Unique identifier for education background.
  - `institution`: Institution where education took place.
  - `degree`: Level of education (Primary, Secondary, College).
  - `fieldOfStudy`: Field of study.
  - `startDate`, `endDate`: Start and end dates of education.
  - `gpa`: Grade Point Average.
  - `rank`: Educational rank.
  - `createdAt`, `updatedAt`: Timestamps for education background creation and last update.

- **Relations:**
  - `student`: Many-to-One relation with the Student model.

### 6. Employee

- **Fields:**

  - `id`: Unique identifier for the employee.
  - `firstName`, `lastName`: Employee's first and last names.
  - `gender`: Enum representing the employee's gender.
  - `phoneNumber`: Unique phone number for the employee.
  - `dateOfBirth`: Date of birth for the employee.
  - `birthOfPlace`: Place of birth for the employee.
  - `department`: Department where the employee works.
  - `createdAt`, `updatedAt`: Timestamps for employee creation and last update.

- **Relations:**
  - `user`: One-to-One relation with the User model.
  - `students`: One-to-Many relation with the Student model.

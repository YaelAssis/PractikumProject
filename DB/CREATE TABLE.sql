/* =========================================================
   DB: Customer Management (Angular + .NET + SQL Server SPs)
   Tables:
     1) dbo.CustomerStatuses
     2) dbo.Cities
     3) dbo.Customers
     4) dbo.CustomerActivities
   ========================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
   DROP (optional, safe order)
   ========================= */
IF OBJECT_ID('dbo.CustomerActivities', 'U') IS NOT NULL DROP TABLE dbo.CustomerActivities;
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
IF OBJECT_ID('dbo.CustomerStatuses', 'U') IS NOT NULL DROP TABLE dbo.CustomerStatuses;
IF OBJECT_ID('dbo.Cities', 'U') IS NOT NULL DROP TABLE dbo.Cities;
GO

/* =========================
   1) CustomerStatuses
   ========================= */
CREATE TABLE dbo.CustomerStatuses
(
    Id   INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_CustomerStatuses PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
        CONSTRAINT UQ_CustomerStatuses_Name UNIQUE
);
GO

/* =========================
   2) Cities
   ========================= */
CREATE TABLE dbo.Cities
(
    Id   INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Cities PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
        CONSTRAINT UQ_Cities_Name UNIQUE
);
GO

/* =========================
   3) Customers
   ========================= */
CREATE TABLE dbo.Customers
(
    Id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Customers PRIMARY KEY,

    FullName NVARCHAR(150) NOT NULL,
    Notes    NVARCHAR(500) NULL,

    StatusId INT NOT NULL,
    CityId   INT NOT NULL,

    Phone    NVARCHAR(30)  NULL,
    Email    NVARCHAR(150) NULL,

    CreatedAt DATETIME2(0) NOT NULL
        CONSTRAINT DF_Customers_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT FK_Customers_Status
        FOREIGN KEY (StatusId) REFERENCES dbo.CustomerStatuses(Id),

    CONSTRAINT FK_Customers_City
        FOREIGN KEY (CityId) REFERENCES dbo.Cities(Id)
);
GO

/* =========================
   4) CustomerActivities
   ========================= */
CREATE TABLE dbo.CustomerActivities
(
    Id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_CustomerActivities PRIMARY KEY,

    CustomerId   INT NOT NULL,
    ActivityType NVARCHAR(50)  NOT NULL,
    Notes        NVARCHAR(500) NULL,

    ActivityDate DATETIME2(0) NOT NULL
        CONSTRAINT DF_CustomerActivities_ActivityDate DEFAULT (SYSDATETIME()),

    CreatedAt DATETIME2(0) NOT NULL
        CONSTRAINT DF_CustomerActivities_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT FK_Activities_Customer
        FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(Id)
        ON DELETE CASCADE
);
GO


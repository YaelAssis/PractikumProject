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

/* =========================================================
   STORED PROCEDURES
   Naming convention:
     Customers_*
     CustomerStatuses_*
     Cities_*
     CustomerActivities_*
   ========================================================= */

------------------------------------------------------------
-- CustomerStatuses_GetAll
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.CustomerStatuses_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name
    FROM dbo.CustomerStatuses
    ORDER BY Name;
END
GO

------------------------------------------------------------
-- Cities_GetAll
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Cities_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name
    FROM dbo.Cities
    ORDER BY Name;
END
GO

------------------------------------------------------------
-- Customers_Create
-- Returns the new Id
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_Create
    @FullName NVARCHAR(150),
    @Notes NVARCHAR(500) = NULL,
    @StatusId INT,
    @CityId INT,
    @Phone NVARCHAR(30) = NULL,
    @Email NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO dbo.Customers (FullName, Notes, StatusId, CityId, Phone, Email)
        VALUES (@FullName, @Notes, @StatusId, @CityId, @Phone, @Email);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS Id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

------------------------------------------------------------
-- Customers_Update
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_Update
    @Id INT,
    @FullName NVARCHAR(150),
    @Notes NVARCHAR(500) = NULL,
    @StatusId INT,
    @CityId INT,
    @Phone NVARCHAR(30) = NULL,
    @Email NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Id = @Id)
        BEGIN
            ;THROW 50001, 'Customer not found.', 1;
        END

        UPDATE dbo.Customers
        SET FullName = @FullName,
            Notes    = @Notes,
            StatusId = @StatusId,
            CityId   = @CityId,
            Phone    = @Phone,
            Email    = @Email
        WHERE Id = @Id;

        SELECT @Id AS Id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

------------------------------------------------------------
-- Customers_GetById (with JOINs + activities list)
-- Returns 2 result sets:
--   1) customer details (friendly names)
--   2) activities for that customer
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set #1: Customer with friendly fields
    SELECT
        c.Id,
        c.FullName,
        c.Notes,
        c.StatusId,
        s.Name AS StatusName,
        c.CityId,
        ci.Name AS CityName,
        c.Phone,
        c.Email,
        c.CreatedAt
    FROM dbo.Customers c
    INNER JOIN dbo.CustomerStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Cities ci ON ci.Id = c.CityId
    WHERE c.Id = @Id;

    -- Result set #2: Activities
    SELECT
        a.Id,
        a.CustomerId,
        a.ActivityType,
        a.Notes,
        a.ActivityDate,
        a.CreatedAt
    FROM dbo.CustomerActivities a
    WHERE a.CustomerId = @Id
    ORDER BY a.ActivityDate DESC, a.Id DESC;
END
GO

------------------------------------------------------------
-- Customers_GetAll (optional free-text search by FullName)
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_GetAll
    @Search NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Id,
        c.FullName,
        c.Notes,
        c.StatusId,
        s.Name AS StatusName,
        c.CityId,
        ci.Name AS CityName,
        c.Phone,
        c.Email,
        c.CreatedAt
    FROM dbo.Customers c
    INNER JOIN dbo.CustomerStatuses s ON s.Id = c.StatusId
    INNER JOIN dbo.Cities ci ON ci.Id = c.CityId
    WHERE (@Search IS NULL OR LTRIM(RTRIM(@Search)) = N'' OR c.FullName LIKE N'%' + @Search + N'%')
    ORDER BY c.CreatedAt DESC, c.Id DESC;
END
GO

------------------------------------------------------------
-- Customers_ChangeStatus (extra action)
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_ChangeStatus
    @Id INT,
    @StatusId INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Id = @Id)
        BEGIN
            ;THROW 50001, 'Customer not found.', 1;
        END

        UPDATE dbo.Customers
        SET StatusId = @StatusId
        WHERE Id = @Id;

        SELECT @Id AS Id, @StatusId AS StatusId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

------------------------------------------------------------
-- Customers_Delete (optional)
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.Customers_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        DELETE FROM dbo.Customers
        WHERE Id = @Id;

        SELECT @Id AS Id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

------------------------------------------------------------
-- CustomerActivities_Create
-- Adds activity for a customer (returns new activity Id)
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.CustomerActivities_Create
    @CustomerId INT,
    @ActivityType NVARCHAR(50),
    @Notes NVARCHAR(500) = NULL,
    @ActivityDate DATETIME2(0) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Id = @CustomerId)
        BEGIN
            ;THROW 50002, 'Customer not found for activity.', 1;
        END

        INSERT INTO dbo.CustomerActivities (CustomerId, ActivityType, Notes, ActivityDate)
        VALUES (@CustomerId, @ActivityType, @Notes, COALESCE(@ActivityDate, SYSDATETIME()));

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS Id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

------------------------------------------------------------
-- CustomerActivities_GetByCustomerId
------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.CustomerActivities_GetByCustomerId
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id,
        a.CustomerId,
        a.ActivityType,
        a.Notes,
        a.ActivityDate,
        a.CreatedAt
    FROM dbo.CustomerActivities a
    WHERE a.CustomerId = @CustomerId
    ORDER BY a.ActivityDate DESC, a.Id DESC;
END
GO
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title HealthcareSystem
 * @dev A comprehensive hospital management contract handling EHRs, Roles, and Blood Bank.
 */
contract HealthcareSystem {
    
    address public admin;

    // Role-Based Access Mappings
    mapping(address => bool) public doctors;
    mapping(address => bool) public patients;

    // Electronic Health Records (EHR) Module
    struct Record {
        string symptoms;
        string aiPrescriptionHash; // IPFS or Mock Hash from AI
        address doctor;
        uint256 timestamp;
    }

    // Mapping a Patient's Address to their array of Medical Records
    mapping(address => Record[]) private patientRecords;

    // Blood Bank Module (Blood Group => Units Available)
    mapping(string => uint256) public bloodInventory;

    // Telemedicine Log Module
    struct Appointment {
        address doctor;
        address patient;
        string meetingLink;
        uint256 timestamp;
    }
    
    Appointment[] public telemedicineLogs;

    // Events
    event DoctorRegistered(address indexed doctor);
    event PatientRegistered(address indexed patient);
    event RecordAdded(address indexed patient, address indexed doctor, string aiPrescriptionHash);
    event BloodInventoryUpdated(string bloodGroup, uint256 units);
    event TelemedicineScheduled(address indexed doctor, address indexed patient, string link);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin can call this");
        _;
    }

    modifier onlyDoctor() {
        require(doctors[msg.sender], "Only registered Doctors can call this");
        _;
    }

    modifier onlyPatient() {
        require(patients[msg.sender], "Only registered Patients can call this");
        _;
    }

    constructor() {
        admin = msg.sender;
        // For testing convenience, Admin is also a doctor and patient initially
        doctors[msg.sender] = true;
        patients[msg.sender] = true;
    }

    // --- ADMIN FUNCTIONS ---

    function registerDoctor(address _doctor) external onlyAdmin {
        doctors[_doctor] = true;
        emit DoctorRegistered(_doctor);
    }

    function registerPatient(address _patient) external onlyAdmin {
        patients[_patient] = true;
        emit PatientRegistered(_patient);
    }

    function updateBloodInventory(string memory _bloodGroup, uint256 _units) external onlyAdmin {
        bloodInventory[_bloodGroup] = _units;
        emit BloodInventoryUpdated(_bloodGroup, _units);
    }

    // --- DOCTOR FUNCTIONS ---

    /**
     * @dev Add a medical record. The AI Prescription is generated off-chain 
     * in the JS UI, and the final validated prescription hash is sent here.
     */
    function addMedicalRecord(
        address _patient, 
        string memory _symptoms, 
        string memory _aiPrescriptionHash
    ) external onlyDoctor {
        require(patients[_patient], "Address is not a registered patient");

        Record memory newRecord = Record({
            symptoms: _symptoms,
            aiPrescriptionHash: _aiPrescriptionHash,
            doctor: msg.sender,
            timestamp: block.timestamp
        });

        patientRecords[_patient].push(newRecord);
        emit RecordAdded(_patient, msg.sender, _aiPrescriptionHash);
    }

    function scheduleTelemedicine(address _patient, string memory _meetingLink) external onlyDoctor {
        require(patients[_patient], "Address is not a registered patient");

        telemedicineLogs.push(Appointment({
            doctor: msg.sender,
            patient: _patient,
            meetingLink: _meetingLink,
            timestamp: block.timestamp
        }));

        emit TelemedicineScheduled(msg.sender, _patient, _meetingLink);
    }

    // --- PATIENT FUNCTIONS ---

    /**
     * @dev Get total number of records for the caller (must be a patient)
     */
    function getMyRecordCount() external view onlyPatient returns (uint256) {
        return patientRecords[msg.sender].length;
    }

    /**
     * @dev Fetch specific medical record of the caller
     */
    function getMyRecord(uint256 _index) external view onlyPatient returns (
        string memory symptoms,
        string memory aiPrescriptionHash,
        address doctor,
        uint256 timestamp
    ) {
        require(_index < patientRecords[msg.sender].length, "Record does not exist");
        Record memory rec = patientRecords[msg.sender][_index];
        return (rec.symptoms, rec.aiPrescriptionHash, rec.doctor, rec.timestamp);
    }

    // --- PUBLIC FUNCTIONS ---

    function getBloodUnits(string memory _bloodGroup) external view returns (uint256) {
        return bloodInventory[_bloodGroup];
    }
}

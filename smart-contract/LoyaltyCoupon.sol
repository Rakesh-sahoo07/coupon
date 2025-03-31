// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title LoyaltyCoupon
 * @dev Smart contract for managing loyalty coupons for organizations
 */
contract LoyaltyCoupon is Ownable {
    using Strings for uint256;
    
    uint256 private _organizationCounter;
    uint256 private _couponCounter;
    
    struct Organization {
        uint256 id;
        string name;
        string description;
        address admin;
        bool isActive;
        uint256 timestamp;
    }
    
    struct Coupon {
        uint256 id;
        uint256 organizationId;
        string code;
        uint256 discountAmount;
        bool isUsed;
        bool isActive;
        address userWallet;
        string userEmail;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Organization) private organizations;
    mapping(uint256 => Coupon) private coupons;
    mapping(address => uint256[]) private userOrganizations;
    mapping(address => uint256[]) private userCoupons;
    mapping(uint256 => uint256[]) private organizationCoupons;
    mapping(string => uint256) private couponCodeToId;
    
    // Events
    event OrganizationCreated(
        uint256 indexed id, 
        string name, 
        address indexed admin, 
        uint256 timestamp
    );
    
    event CouponCreated(
        uint256 indexed id,
        uint256 indexed organizationId,
        string code,
        uint256 discountAmount,
        string userEmail,
        uint256 timestamp
    );
    
    event CouponLinked(
        uint256 indexed id,
        address indexed userWallet,
        uint256 timestamp
    );
    
    event CouponUsed(
        uint256 indexed id,
        address indexed userWallet,
        uint256 timestamp
    );
    
    event CouponShared(
        uint256 indexed id,
        address indexed fromWallet,
        string toEmail,
        uint256 timestamp
    );
    
    constructor() Ownable(msg.sender) {
        _organizationCounter = 0;
        _couponCounter = 0;
    }
    
    /**
     * @dev Creates a new organization
     * @param name Name of the organization
     * @param description Description of the organization
     * @return id of the newly created organization
     */
    function createOrganization(
        string memory name,
        string memory description
    ) external returns (uint256) {
        _organizationCounter++;
        uint256 organizationId = _organizationCounter;
        
        organizations[organizationId] = Organization({
            id: organizationId,
            name: name,
            description: description,
            admin: msg.sender,
            isActive: true,
            timestamp: block.timestamp
        });
        
        userOrganizations[msg.sender].push(organizationId);
        
        emit OrganizationCreated(organizationId, name, msg.sender, block.timestamp);
        
        return organizationId;
    }
    
    /**
     * @dev Modifier to check if sender is admin of the organization
     * @param organizationId The ID of the organization
     */
    modifier onlyOrganizationAdmin(uint256 organizationId) {
        require(
            organizations[organizationId].admin == msg.sender,
            "Only organization admin can perform this action"
        );
        _;
    }
    
    /**
     * @dev Creates a new coupon
     * @param organizationId ID of the organization
     * @param code Unique code for the coupon
     * @param discountAmount Discount amount for the coupon
     * @param userEmail Email of the user to receive the coupon
     * @return id of the newly created coupon
     */
    function createCoupon(
        uint256 organizationId,
        string memory code,
        uint256 discountAmount,
        string memory userEmail
    ) external onlyOrganizationAdmin(organizationId) returns (uint256) {
        require(bytes(code).length > 0, "Coupon code cannot be empty");
        require(couponCodeToId[code] == 0, "Coupon code already exists");
        require(bytes(userEmail).length > 0, "User email cannot be empty");
        
        _couponCounter++;
        uint256 couponId = _couponCounter;
        
        coupons[couponId] = Coupon({
            id: couponId,
            organizationId: organizationId,
            code: code,
            discountAmount: discountAmount,
            isUsed: false,
            isActive: true,
            userWallet: address(0),
            userEmail: userEmail,
            timestamp: block.timestamp
        });
        
        couponCodeToId[code] = couponId;
        organizationCoupons[organizationId].push(couponId);
        
        emit CouponCreated(
            couponId,
            organizationId,
            code,
            discountAmount,
            userEmail,
            block.timestamp
        );
        
        return couponId;
    }
    
    /**
     * @dev Links a coupon to a user's wallet
     * @param code The code of the coupon to link
     */
    function linkCouponToWallet(string memory code) external {
        uint256 couponId = couponCodeToId[code];
        require(couponId > 0, "Coupon not found");
        
        Coupon storage coupon = coupons[couponId];
        require(coupon.isActive, "Coupon is not active");
        require(!coupon.isUsed, "Coupon has already been used");
        require(coupon.userWallet == address(0), "Coupon already linked to a wallet");
        
        coupon.userWallet = msg.sender;
        userCoupons[msg.sender].push(couponId);
        
        emit CouponLinked(couponId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Uses a coupon
     * @param couponId ID of the coupon to use
     */
    function useCoupon(uint256 couponId) external {
        require(couponId > 0 && couponId <= _couponCounter, "Invalid coupon ID");
        
        Coupon storage coupon = coupons[couponId];
        require(coupon.userWallet == msg.sender, "You do not own this coupon");
        require(coupon.isActive, "Coupon is not active");
        require(!coupon.isUsed, "Coupon has already been used");
        
        coupon.isUsed = true;
        
        emit CouponUsed(couponId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Shares a coupon with another user
     * @param couponId ID of the coupon to share
     * @param toEmail Email of the user to share with
     */
    function shareCoupon(uint256 couponId, string memory toEmail) external {
        require(couponId > 0 && couponId <= _couponCounter, "Invalid coupon ID");
        require(bytes(toEmail).length > 0, "Recipient email cannot be empty");
        
        Coupon storage coupon = coupons[couponId];
        require(coupon.userWallet == msg.sender, "You do not own this coupon");
        require(coupon.isActive, "Coupon is not active");
        require(!coupon.isUsed, "Coupon has already been used");
        
        // Remove coupon from current user
        uint256[] storage userCouponsList = userCoupons[msg.sender];
        for (uint256 i = 0; i < userCouponsList.length; i++) {
            if (userCouponsList[i] == couponId) {
                // Replace with the last element and pop
                userCouponsList[i] = userCouponsList[userCouponsList.length - 1];
                userCouponsList.pop();
                break;
            }
        }
        
        coupon.userEmail = toEmail;
        coupon.userWallet = address(0);
        
        emit CouponShared(couponId, msg.sender, toEmail, block.timestamp);
    }
    
    // View functions
    
    /**
     * @dev Gets all organizations for a user
     * @return Array of organization IDs created by the caller
     */
    function getMyOrganizations() external view returns (uint256[] memory) {
        return userOrganizations[msg.sender];
    }
    
    /**
     * @dev Gets details of an organization
     * @param organizationId ID of the organization
     * @return Organization details
     */
    function getOrganization(uint256 organizationId) external view returns (Organization memory) {
        require(organizationId > 0 && organizationId <= _organizationCounter, "Invalid organization ID");
        return organizations[organizationId];
    }
    
    /**
     * @dev Gets all coupons for a user
     * @return Array of coupon IDs owned by the caller
     */
    function getMyCoupons() external view returns (uint256[] memory) {
        return userCoupons[msg.sender];
    }
    
    /**
     * @dev Gets all coupons for an organization
     * @param organizationId ID of the organization
     * @return Array of coupon IDs for the organization
     */
    function getOrganizationCoupons(uint256 organizationId) external view returns (uint256[] memory) {
        require(organizationId > 0 && organizationId <= _organizationCounter, "Invalid organization ID");
        return organizationCoupons[organizationId];
    }
    
    /**
     * @dev Gets details of a coupon
     * @param couponId ID of the coupon
     * @return Coupon details
     */
    function getCoupon(uint256 couponId) external view returns (Coupon memory) {
        require(couponId > 0 && couponId <= _couponCounter, "Invalid coupon ID");
        return coupons[couponId];
    }
    
    /**
     * @dev Gets a coupon ID by its code
     * @param code Code of the coupon
     * @return Coupon ID
     */
    function getCouponIdByCode(string memory code) external view returns (uint256) {
        return couponCodeToId[code];
    }
    
    /**
     * @dev Checks if a user is the admin of an organization
     * @param organizationId ID of the organization
     * @param user Address of the user to check
     * @return True if user is admin
     */
    function isOrganizationAdmin(uint256 organizationId, address user) external view returns (bool) {
        require(organizationId > 0 && organizationId <= _organizationCounter, "Invalid organization ID");
        return organizations[organizationId].admin == user;
    }
    
    /**
     * @dev Gets the current organization counter
     * @return Current organization count
     */
    function getOrganizationCount() external view returns (uint256) {
        return _organizationCounter;
    }
    
    /**
     * @dev Gets the current coupon counter
     * @return Current coupon count
     */
    function getCouponCount() external view returns (uint256) {
        return _couponCounter;
    }
}
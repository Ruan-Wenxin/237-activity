
# Feature: Prepare payment details

## 1. User goal
Pet owners can check the service details and price before making a payment.

## 2. Scope
The system will prepare payment details for the selected pet service. It will not charge money or process any real payments. No payment gateway, new database tables or EJS pages are needed. Login is not required for this classroom exercise.

## 3. Request
The system uses GET /payments/prepare/:serviceId.
The user provides a service ID, and the system gets the price from the mock catalogue instead of accepting a price from the user.

## 4. Service catalogue
- ID 1: Vaccination - $35
- ID 2: Pet Grooming - $50

## 5. Successful response
If the service is found, the system returns HTTP 200 with a JSON response containing exactly five fields:
- serviceId (number)
- serviceName (string)
- amount (number)
- currency (string): "sgd"
- status (string): "READY_FOR_PAYMENT"
READY_FOR_PAYMENT means the service details and price have been prepared, but no actual payment has been made.

## 6. Unsuccessful response
If the service cannot be found, the system returns HTTP 404 with:
{"error":"Service not found"}


## 7. Acceptance criteria
- AC1: Service ID 1 returns HTTP 200 with serviceId 1, serviceName "Vaccination" and amount 35.
- AC2: Service ID 2 returns HTTP 200 with serviceId 2, serviceName "Pet Grooming" and amount 50.
- AC3: Service ID 3 returns HTTP 200 with serviceId 3, serviceName "Boarding" and amount 80.
- AC4: Service ID 999 returns HTTP 404 with {"error":"Service not found"}.
- AC5: All successful responses contain exactly five fields with the correct data types, currency "sgd" and status "READY_FOR_PAYMENT".



## 8. Open questions
- How should the system handle invalid service IDs, such as letters?
- What happens if no service ID is provided?
- Should the 404 response contain only the error field?

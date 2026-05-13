'use strict';

const idParameter = (name, description) => ({
	name,
	in: 'path',
	required: true,
	description,
	schema: { type: 'string' },
});

const openApiSpec = {
	openapi: '3.0.3',
	info: {
		title: 'Fifi Resorts PMS API',
		version: '1.0.0',
		description: 'Swagger documentation for the Fifi Resorts villa property management API.',
	},
	servers: [{ url: '/', description: 'Current server' }],
	tags: [
		{ name: 'Bootstrap' },
		{ name: 'Health' },
		{ name: 'Properties' },
		{ name: 'Room Types' },
		{ name: 'Rooms' },
		{ name: 'Guests' },
		{ name: 'Reservations' },
		{ name: 'Housekeeping' },
		{ name: 'Notifications' },
		{ name: 'Reports' },
		{ name: 'API Keys' },
	],
	/* All protected endpoints require one of these schemes */
	security: [
		{ BearerAuth: [] },
		{ ApiKeyAuth: [] },
	],
	components: {
		securitySchemes: {
			BearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'JWT token from POST /api/auth/login. Expires after 24 h.',
			},
			ApiKeyAuth: {
				type: 'apiKey',
				in: 'header',
				name: 'X-API-Key',
				description: 'Persistent API key (prefix `kpms_`). Create via POST /api/api-keys.',
			},
		},
		schemas: {
			Error: {
				type: 'object',
				properties: {
					error: { type: 'string' },
				},
				required: ['error'],
			},
			DeletedResponse: {
				type: 'object',
				properties: {
					deleted: { type: 'string' },
				},
				required: ['deleted'],
			},
			HealthResponse: {
				type: 'object',
				properties: {
					ok: { type: 'boolean' },
					ts: { type: 'string', format: 'date-time' },
				},
				required: ['ok', 'ts'],
			},
			Property: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					code: { type: 'string' },
					city: { type: 'string', nullable: true },
					rooms: { type: 'integer' },
					floors: { type: 'integer' },
					type: { type: 'string', nullable: true },
				},
				required: ['id', 'name', 'code'],
			},
			PropertyInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					code: { type: 'string' },
					city: { type: 'string', nullable: true },
					rooms: { type: 'integer' },
					floors: { type: 'integer' },
					type: { type: 'string', nullable: true },
				},
			},
			RoomType: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					baseRate: { type: 'number' },
					capacity: { type: 'integer' },
				},
				required: ['id', 'name'],
			},
			RoomTypeInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					baseRate: { type: 'number' },
					capacity: { type: 'integer' },
				},
			},
			Room: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					number: { type: 'string' },
					floor: { type: 'integer' },
					typeId: { type: 'string', nullable: true },
					status: {
						type: 'string',
						enum: ['available', 'occupied', 'dirty', 'clean', 'maintenance'],
					},
					propertyId: { type: 'string' },
					beds: { type: 'integer' },
					sqm: { type: 'integer' },
					amenities: {
						type: 'array',
						items: { type: 'string' },
					},
				},
				required: ['id', 'number', 'propertyId'],
			},
			RoomInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					number: { type: 'string' },
					floor: { type: 'integer' },
					typeId: { type: 'string', nullable: true },
					status: {
						type: 'string',
						enum: ['available', 'occupied', 'dirty', 'clean', 'maintenance'],
					},
					propertyId: { type: 'string' },
					beds: { type: 'integer' },
					sqm: { type: 'integer' },
					amenities: {
						type: 'array',
						items: { type: 'string' },
					},
				},
			},
			RoomStatusUpdate: {
				type: 'object',
				properties: {
					status: {
						type: 'string',
						enum: ['available', 'occupied', 'dirty', 'clean', 'maintenance'],
					},
				},
				required: ['status'],
			},
			Guest: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					email: { type: 'string', nullable: true },
					phone: { type: 'string', nullable: true },
					nationality: { type: 'string', nullable: true },
					idNumber: { type: 'string', nullable: true },
					vip: { type: 'boolean' },
					stays: { type: 'integer' },
					notes: {
						type: 'array',
						items: { type: 'string' },
					},
					lastStay: { type: 'string', format: 'date', nullable: true },
				},
				required: ['id', 'name', 'vip', 'stays', 'notes'],
			},
			GuestInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					email: { type: 'string', nullable: true },
					phone: { type: 'string', nullable: true },
					nationality: { type: 'string', nullable: true },
					idNumber: { type: 'string', nullable: true },
					vip: { type: 'boolean' },
					stays: { type: 'integer' },
					notes: {
						type: 'array',
						items: { type: 'string' },
					},
					lastStay: { type: 'string', format: 'date', nullable: true },
				},
			},
			GuestNoteInput: {
				type: 'object',
				properties: {
					note: { type: 'string' },
				},
				required: ['note'],
			},
			Reservation: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					guestId: { type: 'string' },
					roomId: { type: 'string' },
					typeId: { type: 'string', nullable: true },
					checkIn: { type: 'string', format: 'date' },
					checkOut: { type: 'string', format: 'date' },
					source: { type: 'string', nullable: true },
					paymentStatus: { type: 'string' },
					status: {
						type: 'string',
						enum: ['pending', 'active', 'completed', 'cancelled', 'noshow'],
					},
					total: { type: 'number' },
					paid: { type: 'number' },
					adults: { type: 'integer' },
					children: { type: 'integer' },
					createdAt: { type: 'string', nullable: true },
				},
				required: ['id', 'guestId', 'roomId', 'checkIn', 'checkOut'],
			},
			ReservationInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					guestId: { type: 'string' },
					roomId: { type: 'string' },
					typeId: { type: 'string', nullable: true },
					checkIn: { type: 'string', format: 'date' },
					checkOut: { type: 'string', format: 'date' },
					source: { type: 'string', nullable: true },
					paymentStatus: { type: 'string' },
					status: {
						type: 'string',
						enum: ['pending', 'active', 'completed', 'cancelled', 'noshow'],
					},
					total: { type: 'number' },
					paid: { type: 'number' },
					adults: { type: 'integer' },
					children: { type: 'integer' },
				},
			},
			ReservationCheckInInput: {
				type: 'object',
				properties: {
					roomId: { type: 'string' },
				},
			},
			ReservationCheckoutInput: {
				type: 'object',
				properties: {
					amountPaid: { type: 'number' },
				},
			},
			ReservationPaymentInput: {
				type: 'object',
				properties: {
					paid: { type: 'number' },
					paymentStatus: { type: 'string' },
				},
			},
			ReservationTransitionResponse: {
				type: 'object',
				properties: {
					reservation: { $ref: '#/components/schemas/Reservation' },
					room: { $ref: '#/components/schemas/Room' },
				},
				required: ['reservation', 'room'],
			},
			HousekeepingTask: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					roomId: { type: 'string' },
					status: {
						type: 'string',
						enum: ['dirty', 'cleaning', 'clean', 'inspected', 'maintenance'],
					},
					assignedTo: { type: 'string', nullable: true },
					priority: { type: 'string', nullable: true },
					due: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
				},
				required: ['id', 'roomId', 'status'],
			},
			HousekeepingTaskInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					roomId: { type: 'string' },
					status: {
						type: 'string',
						enum: ['dirty', 'cleaning', 'clean', 'inspected', 'maintenance'],
					},
					assignedTo: { type: 'string', nullable: true },
					priority: { type: 'string', nullable: true },
					due: { type: 'string', nullable: true },
					notes: { type: 'string', nullable: true },
				},
			},
			HousekeepingAssignInput: {
				type: 'object',
				properties: {
					assignedTo: { type: 'string', nullable: true },
				},
			},
			HousekeepingAdvanceResponse: {
				type: 'object',
				properties: {
					task: { $ref: '#/components/schemas/HousekeepingTask' },
					room: { $ref: '#/components/schemas/Room' },
				},
				required: ['task', 'room'],
			},
			Notification: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					read: { type: 'boolean' },
					time: { type: 'string', nullable: true },
					title: { type: 'string' },
					sub: { type: 'string', nullable: true },
					createdAt: { type: 'string', nullable: true },
				},
				required: ['id', 'read', 'title'],
			},
			NotificationInput: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					sub: { type: 'string', nullable: true },
					time: { type: 'string', nullable: true },
				},
			},
			MetricsResponse: {
				type: 'object',
				properties: {
					occupancyPct: { type: 'integer' },
					occupiedRooms: { type: 'integer' },
					availableRooms: { type: 'integer' },
					totalRooms: { type: 'integer' },
					revenue: { type: 'integer' },
					bookings: { type: 'integer' },
					adr: { type: 'integer' },
					revpar: { type: 'integer' },
					avgLengthOfStay: { type: 'number' },
				},
				required: ['occupancyPct', 'occupiedRooms', 'availableRooms', 'totalRooms', 'revenue', 'bookings', 'adr', 'revpar', 'avgLengthOfStay'],
			},
			DayValue: {
				type: 'object',
				properties: {
					day: { type: 'string' },
					value: { type: 'number' },
				},
				required: ['day', 'value'],
			},
			ChannelMixItem: {
				type: 'object',
				properties: {
					source: { type: 'string' },
					pct: { type: 'integer' },
					revenue: { type: 'integer' },
				},
				required: ['source', 'pct', 'revenue'],
			},
			RoomTypePerformanceItem: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					baseRate: { type: 'number' },
					sold: { type: 'integer' },
					avgRate: { type: 'integer' },
					revenue: { type: 'integer' },
					totalRooms: { type: 'integer' },
					rooms: { type: 'integer' },
					occupancy: { type: 'integer' },
				},
				required: ['id', 'name', 'baseRate', 'sold', 'avgRate', 'revenue', 'totalRooms', 'rooms', 'occupancy'],
			},
			InitResponse: {
				type: 'object',
				properties: {
					properties: {
						type: 'array',
						items: { $ref: '#/components/schemas/Property' },
					},
					roomTypes: {
						type: 'array',
						items: { $ref: '#/components/schemas/RoomType' },
					},
					rooms: {
						type: 'array',
						items: { $ref: '#/components/schemas/Room' },
					},
					guests: {
						type: 'array',
						items: { $ref: '#/components/schemas/Guest' },
					},
					reservations: {
						type: 'array',
						items: { $ref: '#/components/schemas/Reservation' },
					},
					housekeepingTasks: {
						type: 'array',
						items: { $ref: '#/components/schemas/HousekeepingTask' },
					},
					notifications: {
						type: 'array',
						items: { $ref: '#/components/schemas/Notification' },
					},
					roomStatuses: {
						type: 'array',
						items: { type: 'string' },
					},
					bookingSources: {
						type: 'array',
						items: { type: 'string' },
					},
					paymentsTimeline: {
						type: 'array',
						items: { $ref: '#/components/schemas/DayValue' },
					},
					occupancyHistory: {
						type: 'array',
						items: { type: 'integer' },
					},
				},
				required: ['properties', 'roomTypes', 'rooms', 'guests', 'reservations', 'housekeepingTasks', 'notifications', 'roomStatuses', 'bookingSources', 'paymentsTimeline', 'occupancyHistory'],
			},
		},
	},
	paths: {
		'/api/health': {
			get: {
				tags: ['Health'],
				summary: 'Health check',
				responses: {
					200: {
						description: 'API health status',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HealthResponse' },
							},
						},
					},
				},
			},
		},
		'/api/init': {
			get: {
				tags: ['Bootstrap'],
				summary: 'Bootstrap frontend data',
				responses: {
					200: {
						description: 'Initial application dataset',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/InitResponse' },
							},
						},
					},
				},
			},
		},
		'/api/properties': {
			get: {
				tags: ['Properties'],
				summary: 'List properties',
				responses: {
					200: {
						description: 'Property list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/Property' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Properties'],
				summary: 'Create a property',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/PropertyInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Property created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Property' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/properties/{id}': {
			get: {
				tags: ['Properties'],
				summary: 'Get a property',
				parameters: [idParameter('id', 'Property ID')],
				responses: {
					200: {
						description: 'Property',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Property' },
							},
						},
					},
					404: {
						description: 'Property not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Properties'],
				summary: 'Update a property',
				parameters: [idParameter('id', 'Property ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/PropertyInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated property',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Property' },
							},
						},
					},
					404: {
						description: 'Property not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Properties'],
				summary: 'Delete a property',
				parameters: [idParameter('id', 'Property ID')],
				responses: {
					200: {
						description: 'Deleted property',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Property not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/room-types': {
			get: {
				tags: ['Room Types'],
				summary: 'List room types',
				responses: {
					200: {
						description: 'Room type list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/RoomType' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Room Types'],
				summary: 'Create a room type',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RoomTypeInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Room type created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/RoomType' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/room-types/{id}': {
			get: {
				tags: ['Room Types'],
				summary: 'Get a room type',
				parameters: [idParameter('id', 'Room type ID')],
				responses: {
					200: {
						description: 'Room type',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/RoomType' },
							},
						},
					},
					404: {
						description: 'Room type not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Room Types'],
				summary: 'Update a room type',
				parameters: [idParameter('id', 'Room type ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RoomTypeInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated room type',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/RoomType' },
							},
						},
					},
					404: {
						description: 'Room type not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Room Types'],
				summary: 'Delete a room type',
				parameters: [idParameter('id', 'Room type ID')],
				responses: {
					200: {
						description: 'Deleted room type',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Room type not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/rooms': {
			get: {
				tags: ['Rooms'],
				summary: 'List rooms',
				parameters: [
					{ name: 'propertyId', in: 'query', schema: { type: 'string' } },
					{ name: 'status', in: 'query', schema: { type: 'string' } },
					{ name: 'typeId', in: 'query', schema: { type: 'string' } },
				],
				responses: {
					200: {
						description: 'Room list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/Room' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Rooms'],
				summary: 'Create a room',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RoomInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Room created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Room' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/rooms/{id}': {
			get: {
				tags: ['Rooms'],
				summary: 'Get a room',
				parameters: [idParameter('id', 'Room ID')],
				responses: {
					200: {
						description: 'Room',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Room' },
							},
						},
					},
					404: {
						description: 'Room not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Rooms'],
				summary: 'Update a room',
				parameters: [idParameter('id', 'Room ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RoomInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated room',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Room' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					404: {
						description: 'Room not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Rooms'],
				summary: 'Delete a room',
				parameters: [idParameter('id', 'Room ID')],
				responses: {
					200: {
						description: 'Deleted room',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Room not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/rooms/{id}/status': {
			patch: {
				tags: ['Rooms'],
				summary: 'Update room status',
				parameters: [idParameter('id', 'Room ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RoomStatusUpdate' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated room',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Room' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					404: {
						description: 'Room not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/guests': {
			get: {
				tags: ['Guests'],
				summary: 'List guests',
				parameters: [
					{ name: 'q', in: 'query', schema: { type: 'string' } },
					{ name: 'vip', in: 'query', schema: { type: 'string', enum: ['1'] } },
				],
				responses: {
					200: {
						description: 'Guest list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/Guest' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Guests'],
				summary: 'Create a guest',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/GuestInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Guest created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Guest' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/guests/{id}': {
			get: {
				tags: ['Guests'],
				summary: 'Get a guest',
				parameters: [idParameter('id', 'Guest ID')],
				responses: {
					200: {
						description: 'Guest',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Guest' },
							},
						},
					},
					404: {
						description: 'Guest not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Guests'],
				summary: 'Update a guest',
				parameters: [idParameter('id', 'Guest ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/GuestInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated guest',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Guest' },
							},
						},
					},
					404: {
						description: 'Guest not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Guests'],
				summary: 'Delete a guest',
				parameters: [idParameter('id', 'Guest ID')],
				responses: {
					200: {
						description: 'Deleted guest',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Guest not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/guests/{id}/notes': {
			patch: {
				tags: ['Guests'],
				summary: 'Append a guest note',
				parameters: [idParameter('id', 'Guest ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/GuestNoteInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated guest',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Guest' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					404: {
						description: 'Guest not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reservations': {
			get: {
				tags: ['Reservations'],
				summary: 'List reservations',
				parameters: [
					{ name: 'status', in: 'query', schema: { type: 'string' } },
					{ name: 'guestId', in: 'query', schema: { type: 'string' } },
					{ name: 'roomId', in: 'query', schema: { type: 'string' } },
					{ name: 'source', in: 'query', schema: { type: 'string' } },
					{ name: 'checkIn', in: 'query', schema: { type: 'string', format: 'date' } },
					{ name: 'checkOut', in: 'query', schema: { type: 'string', format: 'date' } },
				],
				responses: {
					200: {
						description: 'Reservation list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/Reservation' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Reservations'],
				summary: 'Create a reservation',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ReservationInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Reservation created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Reservation' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reservations/{id}': {
			get: {
				tags: ['Reservations'],
				summary: 'Get a reservation',
				parameters: [idParameter('id', 'Reservation ID')],
				responses: {
					200: {
						description: 'Reservation',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Reservation' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Reservations'],
				summary: 'Update a reservation',
				parameters: [idParameter('id', 'Reservation ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ReservationInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated reservation',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Reservation' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Reservations'],
				summary: 'Delete a reservation',
				parameters: [idParameter('id', 'Reservation ID')],
				responses: {
					200: {
						description: 'Deleted reservation',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reservations/{id}/checkin': {
			post: {
				tags: ['Reservations'],
				summary: 'Check in a reservation',
				parameters: [idParameter('id', 'Reservation ID')],
				requestBody: {
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ReservationCheckInInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Reservation checked in',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ReservationTransitionResponse' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					409: {
						description: 'Invalid reservation state',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reservations/{id}/checkout': {
			post: {
				tags: ['Reservations'],
				summary: 'Check out a reservation',
				parameters: [idParameter('id', 'Reservation ID')],
				requestBody: {
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ReservationCheckoutInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Reservation checked out',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ReservationTransitionResponse' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					409: {
						description: 'Invalid reservation state',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reservations/{id}/payment': {
			patch: {
				tags: ['Reservations'],
				summary: 'Update reservation payment',
				parameters: [idParameter('id', 'Reservation ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ReservationPaymentInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated reservation',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Reservation' },
							},
						},
					},
					404: {
						description: 'Reservation not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/housekeeping': {
			get: {
				tags: ['Housekeeping'],
				summary: 'List housekeeping tasks',
				parameters: [
					{ name: 'status', in: 'query', schema: { type: 'string' } },
					{ name: 'roomId', in: 'query', schema: { type: 'string' } },
					{ name: 'priority', in: 'query', schema: { type: 'string' } },
					{ name: 'assignedTo', in: 'query', schema: { type: 'string' } },
				],
				responses: {
					200: {
						description: 'Housekeeping task list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/HousekeepingTask' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Housekeeping'],
				summary: 'Create a housekeeping task',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/HousekeepingTaskInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Housekeeping task created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HousekeepingTask' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/housekeeping/{id}': {
			get: {
				tags: ['Housekeeping'],
				summary: 'Get a housekeeping task',
				parameters: [idParameter('id', 'Housekeeping task ID')],
				responses: {
					200: {
						description: 'Housekeeping task',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HousekeepingTask' },
							},
						},
					},
					404: {
						description: 'Housekeeping task not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			put: {
				tags: ['Housekeeping'],
				summary: 'Update a housekeeping task',
				parameters: [idParameter('id', 'Housekeeping task ID')],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/HousekeepingTaskInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated housekeeping task',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HousekeepingTask' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					404: {
						description: 'Housekeeping task not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
			delete: {
				tags: ['Housekeeping'],
				summary: 'Delete a housekeeping task',
				parameters: [idParameter('id', 'Housekeeping task ID')],
				responses: {
					200: {
						description: 'Deleted housekeeping task',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Housekeeping task not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/housekeeping/{id}/advance': {
			post: {
				tags: ['Housekeeping'],
				summary: 'Advance housekeeping task status',
				parameters: [idParameter('id', 'Housekeeping task ID')],
				responses: {
					200: {
						description: 'Advanced housekeeping task',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HousekeepingAdvanceResponse' },
							},
						},
					},
					404: {
						description: 'Housekeeping task not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
					409: {
						description: 'Invalid housekeeping state',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/housekeeping/{id}/assign': {
			patch: {
				tags: ['Housekeeping'],
				summary: 'Assign housekeeping task',
				parameters: [idParameter('id', 'Housekeeping task ID')],
				requestBody: {
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/HousekeepingAssignInput' },
						},
					},
				},
				responses: {
					200: {
						description: 'Updated housekeeping task',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HousekeepingTask' },
							},
						},
					},
					404: {
						description: 'Housekeeping task not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/notifications': {
			get: {
				tags: ['Notifications'],
				summary: 'List notifications',
				parameters: [
					{ name: 'unread', in: 'query', schema: { type: 'string', enum: ['1'] } },
				],
				responses: {
					200: {
						description: 'Notification list',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/Notification' },
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['Notifications'],
				summary: 'Create a notification',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/NotificationInput' },
						},
					},
				},
				responses: {
					201: {
						description: 'Notification created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Notification' },
							},
						},
					},
					400: {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/notifications/{id}/read': {
			patch: {
				tags: ['Notifications'],
				summary: 'Mark a notification as read',
				parameters: [idParameter('id', 'Notification ID')],
				responses: {
					200: {
						description: 'Updated notification',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Notification' },
							},
						},
					},
					404: {
						description: 'Notification not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/notifications/mark-all-read': {
			post: {
				tags: ['Notifications'],
				summary: 'Mark all notifications as read',
				responses: {
					200: {
						description: 'Operation result',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: { ok: { type: 'boolean' } },
									required: ['ok'],
								},
							},
						},
					},
				},
			},
		},
		'/api/notifications/{id}': {
			delete: {
				tags: ['Notifications'],
				summary: 'Delete a notification',
				parameters: [idParameter('id', 'Notification ID')],
				responses: {
					200: {
						description: 'Deleted notification',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeletedResponse' },
							},
						},
					},
					404: {
						description: 'Notification not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Error' },
							},
						},
					},
				},
			},
		},
		'/api/reports/metrics': {
			get: {
				tags: ['Reports'],
				summary: 'Get KPI metrics',
				responses: {
					200: {
						description: 'Metrics summary',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MetricsResponse' },
							},
						},
					},
				},
			},
		},
		'/api/reports/payments-timeline': {
			get: {
				tags: ['Reports'],
				summary: 'Get payments timeline',
				responses: {
					200: {
						description: 'Daily payment totals',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/DayValue' },
								},
							},
						},
					},
				},
			},
		},
		'/api/reports/occupancy-history': {
			get: {
				tags: ['Reports'],
				summary: 'Get occupancy history',
				responses: {
					200: {
						description: 'Fourteen-point occupancy trend',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { type: 'integer' },
								},
							},
						},
					},
				},
			},
		},
		'/api/reports/channel-mix': {
			get: {
				tags: ['Reports'],
				summary: 'Get booking channel mix',
				responses: {
					200: {
						description: 'Channel mix report',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/ChannelMixItem' },
								},
							},
						},
					},
				},
			},
		},
		'/api/reports/room-type-performance': {
			get: {
				tags: ['Reports'],
				summary: 'Get room type performance',
				responses: {
					200: {
						description: 'Room type performance report',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: { $ref: '#/components/schemas/RoomTypePerformanceItem' },
								},
							},
						},
					},
				},
			},
		},

		'/api/api-keys': {
			get: {
				tags: ['API Keys'],
				summary: 'List all API keys (admin/manager)',
				security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
				responses: {
					200: {
						description: 'List of API keys (no plaintext returned)',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											keyPrefix: { type: 'string', example: 'kpms_e178ba3' },
											name: { type: 'string' },
											createdAt: { type: 'string', format: 'date-time' },
											lastUsed: { type: 'string', format: 'date-time', nullable: true },
											username: { type: 'string' },
											userName: { type: 'string' },
										},
									},
								},
							},
						},
					},
				},
			},
			post: {
				tags: ['API Keys'],
				summary: 'Create a new API key (admin/manager) — plaintext shown once',
				security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['name'],
								properties: {
									name: { type: 'string', description: 'Human-readable label for the key' },
									userId: { type: 'string', description: 'User to associate the key with (defaults to caller)' },
								},
							},
						},
					},
				},
				responses: {
					201: {
						description: 'API key created — store the `key` value securely, it will not be shown again',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										key: { type: 'string', example: 'kpms_e178ba38223ebf760fe719368a54e018' },
										keyPrefix: { type: 'string' },
										name: { type: 'string' },
										createdAt: { type: 'string', format: 'date-time' },
										note: { type: 'string' },
									},
								},
							},
						},
					},
					400: { description: 'Missing name', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
					403: { description: 'Admin access required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				},
			},
		},

		'/api/api-keys/{id}': {
			delete: {
				tags: ['API Keys'],
				summary: 'Revoke an API key (admin/manager)',
				security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
				parameters: [idParameter('id', 'API key ID')],
				responses: {
					200: { description: 'Key revoked', content: { 'application/json': { schema: { $ref: '#/components/schemas/DeletedResponse' } } } },
					404: { description: 'Key not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
				},
			},
		},
	},
};

module.exports = { openApiSpec };

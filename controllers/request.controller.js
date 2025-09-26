const Request = require('../models/request.model');
const User = require('../models/user.model'); // Assuming you might need User model for population

// Helper function to populate submittedBy and reviewedBy fields
const populateRequestFields = (query) => {
    return query.populate('submittedBy', 'name email').populate('reviewedBy', 'name email');
};

// @desc    Create a new request
// @route   POST /api/requests
// @access  Private (User)
exports.createRequest = async (req, res, next) => {
    try {
        const { type, data } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const newRequest = new Request({
            type,
            data,
            submittedBy: req.user.id,
            status: 'pending', // Default status for new requests
        });

        const savedRequest = await newRequest.save();

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            data: savedRequest,
        });
    } catch (error) {
        console.error('Error creating request:', error);
        next(error);
    }
};

// @desc    Get all requests (Admin only)
// @route   GET /api/requests
// @access  Private (Admin)
exports.getAllRequests = async (req, res, next) => {
    try {
        const requests = await populateRequestFields(Request.find({}));
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        console.error('Error getting all requests:', error);
        next(error);
    }
};

// @desc    Get pending requests (Admin only)
// @route   GET /api/requests/pending
// @access  Private (Admin)
exports.getPendingRequests = async (req, res, next) => {
    try {
        const requests = await populateRequestFields(Request.find({ status: 'pending' }));
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        console.error('Error getting pending requests:', error);
        next(error);
    }
};

// @desc    Process a single request (Admin only)
// @route   PUT /api/requests/:id/process
// @access  Private (Admin)
exports.processRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reviewNotes } = req.body;

        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided' });
        }

        request.status = status;
        request.reviewNotes = reviewNotes;
        request.reviewedBy = req.user.id; // Set the admin who reviewed it

        // Additional logic based on request type (e.g., update article status)
        if (request.type === 'article_approval' && request.data && request.data.articleId) {
            const Article = require('../models/article.model'); // Load Article model here to avoid circular dependency
            await Article.findByIdAndUpdate(request.data.articleId, { status: status === 'approved' ? 'published' : 'rejected' });
        }
        // Add more logic for other request types here if needed (e.g., confirm appointment)

        const updatedRequest = await request.save();

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            data: updatedRequest,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        next(error);
    }
};

// @desc    Bulk process requests (Admin only)
// @route   POST /api/requests/bulk-process
// @access  Private (Admin)
exports.bulkProcessRequests = async (req, res, next) => {
    try {
        const { requestIds, status, reviewNotes } = req.body;

        if (!Array.isArray(requestIds) || !requestIds.length) {
            return res.status(400).json({ success: false, message: 'requestIds array is required' });
        }
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided' });
        }

        const processedRequests = [];
        for (const requestId of requestIds) {
            const request = await Request.findById(requestId);
            if (request) {
                request.status = status;
                request.reviewNotes = reviewNotes;
                request.reviewedBy = req.user.id;

                if (request.type === 'article_approval' && request.data && request.data.articleId) {
                    const Article = require('../models/article.model');
                    await Article.findByIdAndUpdate(request.data.articleId, { status: status === 'approved' ? 'published' : 'rejected' });
                }
                
                await request.save();
                processedRequests.push(request._id);
            }
        }

        res.status(200).json({
            success: true,
            message: `${processedRequests.length} requests processed successfully`,
            count: processedRequests.length,
            processedRequests,
        });
    } catch (error) {
        console.error('Error bulk processing requests:', error);
        next(error);
    }
};

// @desc    Get all requests submitted by the authenticated user
// @route   GET /api/requests/user
// @access  Private (User)
exports.getUserRequests = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            console.log('DEBUG: getUserRequests - Not authenticated (req.user missing)'); // ADD THIS
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        console.log('DEBUG: getUserRequests - User ID:', req.user.id); // ADD THIS

        // Find requests where submittedBy matches the logged-in user's ID
        const requests = await populateRequestFields(Request.find({ submittedBy: req.user.id }));
        
        console.log('DEBUG: getUserRequests - Found requests:', requests.length); // ADD THIS
        // console.log('DEBUG: getUserRequests - Full requests data:', requests); // UNCOMMENT FOR MORE DETAIL IF NEEDED

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        console.error('Error getting user requests:', error);
        next(error);
    }
};

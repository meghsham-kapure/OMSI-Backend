import AppError from "../utils/AppError.utils.js";
import * as TeamRepo from "../repositories/employee.repository.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.utils.js";

const getFileFromMulterFields = (files, fieldName) => {
  return Array.isArray(files?.[fieldName]) ? files[fieldName][0] : null;
};

const buildPublicId = (prefix, originalname) => {
  const fileName = originalname
    .split(".")[0]
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${prefix}-${Date.now()}-${fileName}`;
};

export const createTeamMemberService = async ({
  teamDetails,
  teamFiles = {},
}) => {
  const imageFile = getFileFromMulterFields(teamFiles, "image");
  const resumeFile = getFileFromMulterFields(teamFiles, "resume");

  if (!imageFile) {
    throw new AppError({
      httpStatusCode: 400,
      message: "Employee member image is required",
      error: new Error("Employee member image is required"),
    });
  }

  if (!resumeFile) {
    throw new AppError({
      httpStatusCode: 400,
      message: "Employee member resume is required",
      error: new Error("Employee member resume is required"),
    });
  }

  const uploadedFiles = [];

  try {
    const uploadedImage = await uploadBufferToCloudinary({
      buffer: imageFile.buffer,
      folder: process.env.CLOUDINARY_TEAM_IMAGE_FOLDER || "omseva/employee/images",
      publicId: buildPublicId("employee-image", imageFile.originalname),
      resourceType: "image",
    });

    uploadedFiles.push({
      publicId: uploadedImage.public_id,
      resourceType: "image",
    });

    const uploadedResume = await uploadBufferToCloudinary({
      buffer: resumeFile.buffer,
      folder:
        process.env.CLOUDINARY_TEAM_RESUME_FOLDER || "omseva/employee/resumes",
      publicId: buildPublicId("employee-resume", resumeFile.originalname),
      resourceType: "raw",
    });

    uploadedFiles.push({
      publicId: uploadedResume.public_id,
      resourceType: "raw",
    });

    const createdTeamMember = await TeamRepo.createTeamMember({
      ...teamDetails,

      image: {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        resourceType: "image",
      },

      resume: {
        url: uploadedResume.secure_url,
        publicId: uploadedResume.public_id,
        resourceType: "raw",
      },
    });

    return {
      success: true,
      message: "Employee member created successfully",
      data: {
        teamMemberId: createdTeamMember._id,
        slug: createdTeamMember.slug,
        name: createdTeamMember.name,
        designation: createdTeamMember.designation,
        isLeader: createdTeamMember.isLeader,
        isLive: createdTeamMember.isLive,
        image: createdTeamMember.image,
        resume: createdTeamMember.resume,
      },
    };
  } catch (error) {
    await Promise.allSettled(
      uploadedFiles.map((file) =>
        deleteFromCloudinary({
          publicId: file.publicId,
          resourceType: file.resourceType,
        })
      )
    );

    throw new AppError({
      httpStatusCode: 500,
      message: "Employee member creation failed",
      error,
    });
  }
};

export const getAllTeamMembersService = async () => {
  const teamMembers = await TeamRepo.findAllTeamMembers();

  return {
    success: true,
    message: "Employee members fetched successfully",
    data: {
      teamMembers,
      totalTeamMembers: teamMembers.length,
    },
  };
};

export const deleteTeamMemberByIdService = async (teamMemberId) => {
  const existingTeamMember = await TeamRepo.findTeamMemberById(teamMemberId);

  if (!existingTeamMember) {
    throw new AppError({
      httpStatusCode: 404,
      message: "Employee member not found",
      error: new Error("Employee member not found"),
    });
  }

  await Promise.allSettled([
    deleteFromCloudinary({
      publicId: existingTeamMember.image.publicId,
      resourceType: existingTeamMember.image.resourceType,
    }),

    deleteFromCloudinary({
      publicId: existingTeamMember.resume.publicId,
      resourceType: existingTeamMember.resume.resourceType,
    }),
  ]);

  const deletedTeamMember = await TeamRepo.deleteTeamMemberById(teamMemberId);

  return {
    success: true,
    message: "Employee member deleted successfully",
    data: {
      teamMemberId: deletedTeamMember._id,
    },
  };
};

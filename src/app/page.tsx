"use client";

import React, { useState } from "react";
import shortid from "shortid";
import { PDFDocument, degrees } from 'pdf-lib';

interface FileData {
  id: string;
  filename: string;
  filetype: string;
  filepfd: string | ArrayBuffer | null;
  datetime: string;
  filesize: string;
  roteval: string;
  file: File;
}

const pageSizes = {
  a4: {
      width: 594.96,
      height: 841.92,
  },
  letter: {
      width: 612,
      height: 792,
  },
};

interface RotationData {
  value: string;
}

const FileUpload: React.FC = () => {
  const [selectedfile, SetSelectedFile] = useState<FileData[]>([]);
  const [Files, SetFiles] = useState<FileData[]>([]);
  const [Value] = useState<RotationData>({ value: '90' });
  
  const filesizes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const InputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          SetSelectedFile((preValue) => {
            return [
              ...preValue,
              {
                id: shortid.generate(),
                filename: file.name,
                filetype: file.type,
                file: file,
                filepfd: reader.result,
                roteval: Value.value,
                datetime: new Date(file.lastModified).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                filesize: filesizes(file.size)
              }
            ];
          });
        };
        if (file) {
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const FileUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      (e.target as HTMLFormElement).reset();
      if (selectedfile.length > 0) {
          for (let index = 0; index < selectedfile.length; index++) {
              const pfdFile = selectedfile[index].file;
              const pdfDoc = await PDFDocument.load(await pfdFile.arrayBuffer(), { ignoreEncryption: true });
              const pages = pdfDoc.getPages()
              const new_size = pageSizes['a4'];
              const new_size_ratio = Math.round((new_size.width / new_size.height) * 100);
              pages.forEach(page => {
                const { width, height } = page.getMediaBox();
                const size_ratio = Math.round((width / height) * 100);
                // If ratio of original and new format are too different we can not simply scale (more that 1%)
                if (Math.abs(new_size_ratio - size_ratio) > 1) {
                    // Change page size
                    page.setSize(new_size.width, new_size.height);
                    const scale_content = Math.min(new_size.width / width, new_size.height / height);
                    // Scale content
                    page.scaleContent(scale_content, scale_content);
                    const scaled_diff = {
                        width: Math.round(new_size.width - scale_content * width),
                        height: Math.round(new_size.height - scale_content * height),
                    };
                    // Center content in new page format
                    page.translateContent(Math.round(scaled_diff.width / 2), Math.round(scaled_diff.height / 2));
                } else {
                    page.scale(new_size.width / width, new_size.height / height);
                }
                const setRota = parseInt(selectedfile[index].roteval, 10);
                page.setRotation(degrees(setRota + page.getRotation().angle));
              });
              const pdfBytes = await pdfDoc.save();
              const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
              const fileReader = new FileReader();
              fileReader.onload = function() {
                fileReader.readAsDataURL(blob);
              }
              const b64 = Buffer.from(pdfBytes).toString('base64');
              const dataUrl = "data:application/pdf;base64," + b64;
              selectedfile[index].filepfd = dataUrl;
              SetFiles((preValue)=> {
                  return [
                      ...preValue,
                      selectedfile[index]
                  ]   
              })
          }
          SetSelectedFile([]);
      } else {
          alert('Please select file')
      }
  };

  const DeleteSelectFile = (id: string) => {
    if(window.confirm("Are you sure you want to delete this file?")){
        const result = selectedfile.filter((data) => data.id !== id);
        SetSelectedFile(result);
    }else{
        // alert('No');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">PDF File Upload & Rotate 1</h2>
            <p className="text-gray-600 mt-1">Upload your PDF files and adjust their rotation</p>
          </div>

          <form onSubmit={FileUploadSubmit}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="fileupload"
                className="hidden"
                onChange={InputChange}
                multiple
                accept="application/pdf"
              />
              <label htmlFor="fileupload" className="cursor-pointer">
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1">Drag and drop files here, or <span className="text-blue-500 font-medium">browse</span></p>
                  <p className="text-sm text-gray-500">PDF files only</p>
                </div>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {selectedfile.map((data) => (
                <div key={data.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{data.filename}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <span>{data.filesize}</span>
                      <span className="mx-2">•</span>
                      <span>{data.datetime}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    <select
                      className="block w-20 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="90"
                      onChange={(e) => {
                        SetSelectedFile((prevFiles) =>
                          prevFiles.map((file) =>
                            file.id === data.id ? { ...file, roteval: e.target.value } : file
                          )
                        )
                      }}
                    >
                      <option value="90">90°</option>
                      <option value="180">180°</option>
                      <option value="270">270°</option>
                      <option value="-90">-90°</option>
                      <option value="0">0°</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => DeleteSelectFile(data.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedfile.length > 0 && (
              <button
                type="submit"
                className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload and Process Files
              </button>
            )}
          </form>

          {Files.length > 0 && (
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Processed Files</h3>
              <div className="space-y-4">
                {Files.map((data, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{data.filename}</h3>
                      <div className="mt-1 text-sm text-gray-500">
                        <span>{data.filesize}</span>
                        <span className="mx-2">•</span>
                        <span>{data.datetime}</span>
                      </div>
                    </div>
                    <a
                      href={typeof data.filepfd === 'string' ? data.filepfd : undefined}
                      download={data.filename}
                      className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

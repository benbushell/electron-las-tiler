// Interface for tiling large LAS files.

import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";
const socket = io.connect("http://localhost:3001");

const points = [];
const bounds = [];

const tileSize = 25;
const canvasSize = [400, 400];

const App = () => {
  const [message, setMessage] = useState(
    "C:\\Users\\HP ZBook\\OneDrive\\CMM\\LAS Programs\\Test Point Clouds\\Tile_X+0000115825_Y+0000190150.las"
  );
  const [header, setHeader] = useState();
  const [tileProgress, setTileProgress] = useState({});
  const [string, setString] = useState();

  const getFileInfo = () => {
    socket.emit("get_file_info", { message });
  };

  function convertRange(value, axis) {
    let range;
    if (header.max.x - header.min.x > header.max.y - header.min.y) {
      range = header.max.x - header.min.x;
    } else {
      range = header.max.y - header.min.y;
    }

    switch (axis) {
      case "x":
        return ((value - header.min.x) * (canvasSize[1] - 0)) / range + 0;
      case "y":
        return ((value - header.min.y) * (canvasSize[1] - 0)) / range + 0;
    }
  }

  const tileFile = () => {
    socket.emit("begin_tiling", { message });
  };

  useEffect(() => {
    socket.on("file_info", (data) => {
      setHeader(data);
    });

    socket.on("tiling_progress", (data) => {
      console.log(data);
      setTileProgress(data);
      if (data.quadCompleted !== "true") {
        points.push([data.currX, data.currY]);
      }
      if (data.boundX !== "0") {
        bounds.push([data.boundX, data.boundY]);
      }
    });
  }, [socket]);

  return (
    <div className="main">
      <div className="header">
        <div className="header-left">
          <div>Pointcloud Filepath</div>
          <input
            className="header-input"
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          ></input>
          <div className="header-submit" onClick={getFileInfo}>
            Submit
          </div>
        </div>
        <div className="header-right"></div>
      </div>
      <div className="main-body">
        <div className="panel">
          {header ? (
            <>
              <div>Parameters</div>
              <div className="panel-parameters">
                <div>
                  <div>Point Records</div>
                  <div>Point Record Offset</div>
                  <div>Point Record Format</div>
                  <div>Point Record Length</div>
                </div>
                <div>
                  <div>{header.pointRecords}</div>
                  <div>{header.pointRecordOffset}</div>
                  <div>{header.pointRecordFormat}</div>
                  <div>{header.pointRecordLength}</div>
                </div>
              </div>
              <table>
                <tr>
                  <th></th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Z</th>
                </tr>
                <tr>
                  <th>Scale</th>
                  <td>{header.scale.x}</td>
                  <td>{header.scale.y}</td>
                  <td>{header.scale.z}</td>
                </tr>
                <tr>
                  <th>Offset</th>
                  <td>{header.offset.x}</td>
                  <td>{header.offset.y}</td>
                  <td>{header.offset.z}</td>
                </tr>
                <tr>
                  <th>Min</th>
                  <td>{header.min.x}</td>
                  <td>{header.min.y}</td>
                  <td>{header.min.z}</td>
                </tr>
                <tr>
                  <th>Max</th>
                  <td>{header.max.x}</td>
                  <td>{header.max.y}</td>
                  <td>{header.max.z}</td>
                </tr>
              </table>
              <div className="tiling-button" onClick={tileFile}>
                Begin Tiling
              </div>
              <div className="progress-bar">
                <div
                  className="inner-progress"
                  style={{
                    width: `${250 * (tileProgress.quadCompletion / 100)}px`,
                  }}
                ></div>
              </div>
              {tileProgress.quadCompleted === "true" ? (
                <div>
                  <div>Quadtree build complete</div>
                  <div>Creating Tiles :</div>
                  <div className="progress-bar">
                    <div
                      className="inner-progress"
                      style={{
                        width: `${
                          250 *
                          (tileProgress.boundaryCount / tileProgress.boundaries)
                        }px`,
                      }}
                    ></div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="viewer">
          <svg height={canvasSize[0]} width={canvasSize[1]}>
            <g>
              {points.map((pt) => (
                <ellipse
                  fill="white"
                  cx={convertRange(pt[0], "x")}
                  cy={convertRange(pt[1], "y")}
                  rx={1}
                  ry={1}
                />
              ))}
              {bounds.map((bound) => (
                <g>
                  <ellipse
                    cx={convertRange(bound[0], "x")}
                    cy={convertRange(bound[1], "y")}
                    rx={2}
                    ry={2}
                  />
                  <rect
                    x={convertRange(bound[0], "x")}
                    y={convertRange(bound[1], "y")}
                    width={convertRange(header.min.x + tileSize, "x")}
                    height={convertRange(header.min.y + tileSize, "y")}
                    fill="none"
                    stroke="black"
                    transform={`translate(-${convertRange(
                      header.min.x + tileSize / 2,
                      "x"
                    )},-${convertRange(header.min.y + tileSize / 2, "y")})`}
                  />
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div>
  //     <div>Please enter the filepath : </div>
  //     <input
  //       type="text"
  //       value={message}
  //       onChange={(e) => {
  //         setMessage(e.target.value);
  //       }}
  //     ></input>
  //     <button onClick={getFileInfo}>Submit</button>
  //     {header ? (
  //       <div>
  //         <div>
  //           <div>{header.filepath}</div>
  //         </div>
  //         <button onClick={tileFile}>Begin Tiling</button>
  //         <div>{tileProgress.quadCompletion}%</div>
  //         <div>{tileProgress.timeTaken}s</div>
  //         <div>{tileProgress.quadCompleted}</div>
  //         <button
  //           onClick={() => {
  //             console.log(bounds);
  //           }}
  //         >
  //           Log Points
  //         </button>
  //         {header ? (
  //           <svg height={canvasSize[0]} width={canvasSize[1]}>
  //             <g>
  //               {points.map((pt) => (
  //                 <ellipse
  //                   fill="red"
  //                   cx={convertRange(pt[0], "x")}
  //                   cy={convertRange(pt[1], "y")}
  //                   rx={1}
  //                   ry={1}
  //                 />
  //               ))}
  //               {bounds.map((bound) => (
  //                 <g>
  //                   <ellipse
  //                     cx={convertRange(bound[0], "x")}
  //                     cy={convertRange(bound[1], "y")}
  //                     rx={2}
  //                     ry={2}
  //                   />
  //                   <rect
  //                     x={convertRange(bound[0], "x")}
  //                     y={convertRange(bound[1], "y")}
  //                     width={convertRange(header.min.x + tileSize, "x")}
  //                     height={convertRange(header.min.y + tileSize, "y")}
  //                     fill="none"
  //                     stroke="black"
  //                     transform={`translate(-${convertRange(
  //                       header.min.x + tileSize / 2,
  //                       "x"
  //                     )},-${convertRange(header.min.y + tileSize / 2, "y")})`}
  //                   />
  //                 </g>
  //               ))}
  //             </g>
  //           </svg>
  //         ) : null}
  //       </div>
  //     ) : null}
  //   </div>
  // );
};

export default App;

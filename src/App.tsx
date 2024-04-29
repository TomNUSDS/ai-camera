import './App.css';
import '../node_modules/@uswds/uswds/dist/css/uswds.css';
import '@trussworks/react-uswds/lib/index.css';
import './styles/uswds.navmenu.override.css';

import {Grid, GridContainer, Header as USWDSHeader} from "@trussworks/react-uswds";
import {TakePhotoPage} from "./pages/TakePhotoPage.tsx";
import {useReducer} from "react";
import {HomePage} from "./pages/HomePage.tsx";
import {ScanDocPage} from "./pages/ScanDocPage.tsx";
import {ToastContainer} from "react-toastify";

// roll our own nav. Doing anything too fancy is difficult on github pages because of paths.
// keys are UX names which isn't great but whatever. It's just a few lines of code.
// We could switch to <HashRouter> if this site gets complex enough
const Pages = ["Home", "Photo ID", "Document scan"] as const;
type PagesType = (typeof Pages)[number];
type PagesMap = {
  [key in PagesType]?: React.ReactElement;
};

export const App = () => {
  const [page, setPage] = useReducer((_prev: PagesType, cur: PagesType) => {
    localStorage.setItem('currentPage', cur);
    return cur;
  }, (localStorage.getItem('currentPage') as PagesType) || "Home");
  const PAGES_MAP: PagesMap = {
    "Home": <HomePage/>,
    "Photo ID": <TakePhotoPage />,
    "Document scan": <ScanDocPage />,
  };


  // const videoCaptureRef = useRef(null);
  return (
    <>
      <USWDSHeader basic>
        {/* We could use <PrimaryNav> here but the css breakpoint for the mobile is annoying */}
        <div className="usa-nav-custom-container">
          <nav className="usa-nav-custom" aria-label="Primary navigation">
            <ul className="usa-nav-custom__primary usa-accordion">
              {Pages.map((eachPage) =>
                <li key={eachPage} className="usa-nav-custom__primary-item">
                  <a href="" type="primary"
                     className={eachPage === page ? "usa-nav-custom__link usa-current" : "usa-nav-custom__link"}
                     onClick={(e) => {
                       setPage(eachPage);
                       e.preventDefault();
                       e.stopPropagation();
                     }}>{eachPage}</a>
                </li>)}
            </ul>
          </nav>
        </div>
      </USWDSHeader>
      <div className="usa-section">
        <GridContainer>
          <Grid row gap>
            <main
              className="usa-layout-docs__main desktop:grid-col-12 usa-prose usa-layout-docs"
              id="main-content"
              role={"main"}
            >
              {PAGES_MAP[page] ?? PAGES_MAP.Home}
            </main>
          </Grid>
        </GridContainer>
      </div>
      <ToastContainer limit={4}/>
    </>
  )
}

